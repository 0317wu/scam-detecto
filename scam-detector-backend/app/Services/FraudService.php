<?php

namespace App\Services;

use App\Helpers\RuleHelper;
use App\Helpers\ScoreHelper;
use App\Models\ScamScan;
use App\Models\User;
use Closure;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

class FraudService
{
    private const CACHE_TTL_SECONDS = 1800;

    public function __construct(
        private readonly RuleHelper $ruleHelper,
        private readonly ScoreHelper $scoreHelper,
        private readonly OcrService $ocrService,
        private readonly AiFraudService $aiFraudService,
    ) {
    }

    public function analyzeText(string $content, ?User $user = null): array
    {
        return $this->analyzeWithCache(
            'text',
            trim($content),
            ['content' => $content],
            fn () => $this->buildAnalysis('text', $content, $this->ruleHelper->detectTextRules($content)),
            $user
        );
    }

    public function analyzeUrl(string $url, ?User $user = null): array
    {
        return $this->analyzeWithCache(
            'url',
            strtolower(trim($url)),
            ['url' => $url],
            fn () => $this->buildAnalysis('url', $url, $this->ruleHelper->detectUrlRules($url)),
            $user
        );
    }

    public function analyzeImage(UploadedFile $image, ?User $user = null): array
    {
        $imageHash = hash_file('sha256', $image->getRealPath());
        $imagePath = $image->store('scam-images', 'public');
        $absolutePath = Storage::disk('public')->path($imagePath);

        return $this->analyzeWithCache(
            'image',
            $imageHash,
            ['image_path' => $imagePath],
            function () use ($absolutePath) {
                $ocrText = $this->ocrService->extractText($absolutePath);

                return $this->buildAnalysis('image', $ocrText, $this->ruleHelper->detectTextRules($ocrText)) + [
                    'ocr_text' => $ocrText,
                ];
            },
            $user
        );
    }

    private function analyzeWithCache(
        string $inputType,
        string $cacheSource,
        array $payload,
        Closure $analysisBuilder,
        ?User $user
    ): array {
        $cacheKey = $this->cacheKey($inputType, $cacheSource);
        $analysis = Cache::get($cacheKey);
        $cacheHit = $analysis !== null;

        if (! $cacheHit) {
            $analysis = $analysisBuilder();
            Cache::put($cacheKey, $analysis, self::CACHE_TTL_SECONDS);
        }

        $scan = ScamScan::create($payload + $analysis + [
            'user_id' => $user?->id,
            'input_type' => $inputType,
        ]);

        return [
            'scan' => $scan,
            'cache_hit' => $cacheHit,
        ];
    }

    private function buildAnalysis(string $inputType, string $content, array $matches): array
    {
        $ruleAnalysis = $this->buildRuleAnalysis($matches);
        $aiAnalysis = $this->aiFraudService->analyze($inputType, $content, $ruleAnalysis);

        if ($aiAnalysis !== null) {
            return $this->mergeRuleAndAiAnalysis($ruleAnalysis, $aiAnalysis);
        }

        return $ruleAnalysis + [
            'ai_raw_response' => null,
        ];
    }

    private function buildRuleAnalysis(array $matches): array
    {
        $score = $this->scoreHelper->calculateRiskScore($matches);
        $level = $this->scoreHelper->determineRiskLevel($score);
        $scamType = $this->scoreHelper->determineScamType($matches);
        $factors = array_values(array_unique(array_column($matches, 'factor')));

        return [
            'risk_score' => $score,
            'risk_level' => $level,
            'scam_type' => $scamType,
            'summary' => $this->buildSummary($level, $scamType, $factors),
            'risk_factors' => $factors,
            'suggestions' => $this->scoreHelper->suggestionsForLevel($level),
        ];
    }

    private function mergeRuleAndAiAnalysis(array $ruleAnalysis, array $aiAnalysis): array
    {
        $riskScore = max((int) $ruleAnalysis['risk_score'], (int) $aiAnalysis['risk_score']);
        $riskLevel = $this->scoreHelper->determineRiskLevel($riskScore);

        return [
            'risk_score' => $riskScore,
            'risk_level' => $riskLevel,
            'scam_type' => $aiAnalysis['scam_type'] ?: $ruleAnalysis['scam_type'],
            'summary' => $aiAnalysis['summary'] ?: $ruleAnalysis['summary'],
            'risk_factors' => array_values(array_unique(array_merge(
                $ruleAnalysis['risk_factors'],
                $aiAnalysis['risk_factors']
            ))),
            'suggestions' => array_values(array_unique(array_merge(
                $aiAnalysis['suggestions'],
                $ruleAnalysis['suggestions']
            ))),
            'ai_raw_response' => $aiAnalysis['ai_raw_response'] ?? null,
        ];
    }

    private function cacheKey(string $inputType, string $source): string
    {
        return sprintf('fraud_scan:%s:%s', $inputType, hash('sha256', $source));
    }

    private function buildSummary(string $level, string $scamType, array $factors): string
    {
        if ($factors === []) {
            return '目前未偵測到明顯詐騙特徵，但仍建議確認訊息來源。';
        }

        return match ($level) {
            'danger' => "此內容高度疑似{$scamType}，包含多個高風險特徵。",
            'warning' => "此內容有可疑特徵，可能與{$scamType}相關，建議進一步查證。",
            default => '目前僅偵測到低風險特徵，仍請保持警覺。',
        };
    }
}
