<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

class AiFraudService
{
    public function isEnabled(): bool
    {
        return (bool) config('ai.enabled') && filled(config('ai.openai.api_key'));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function analyze(string $inputType, string $content, array $ruleAnalysis): ?array
    {
        if (! $this->isEnabled()) {
            return null;
        }

        try {
            return $this->callOpenAi($inputType, $content, $ruleAnalysis);
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function callOpenAi(string $inputType, string $content, array $ruleAnalysis): array
    {
        $response = Http::withToken(config('ai.openai.api_key'))
            ->timeout(config('ai.timeout'))
            ->acceptJson()
            ->post(config('ai.openai.base_url').'/chat/completions', [
                'model' => config('ai.openai.model'),
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->systemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode([
                            'input_type' => $inputType,
                            'content' => $content,
                            'rule_analysis' => $ruleAnalysis,
                        ], JSON_UNESCAPED_UNICODE),
                    ],
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('ai_request_failed');
        }

        $content = $response->json('choices.0.message.content');
        $decoded = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($decoded)) {
            throw new RuntimeException('ai_invalid_json');
        }

        return $this->normalize($decoded, $response->json());
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
You are a Taiwan anti-scam analysis service. Return JSON only.
Analyze the provided message, URL, or OCR text for scam risk.
Use Traditional Chinese for summary, risk_factors, suggestions, and scam_type.
Return this JSON shape:
{
  "risk_score": 0,
  "risk_level": "safe|warning|danger",
  "scam_type": "string",
  "summary": "string",
  "risk_factors": ["string"],
  "suggestions": ["string"]
}
PROMPT;
    }

    /**
     * @param array<string, mixed> $decoded
     * @param array<string, mixed> $rawResponse
     * @return array<string, mixed>
     */
    private function normalize(array $decoded, array $rawResponse): array
    {
        $score = (int) ($decoded['risk_score'] ?? 0);
        $score = min(100, max(0, $score));
        $level = $decoded['risk_level'] ?? 'safe';

        if (! in_array($level, ['safe', 'warning', 'danger'], true)) {
            $level = match (true) {
                $score >= 70 => 'danger',
                $score >= 35 => 'warning',
                default => 'safe',
            };
        }

        return [
            'risk_score' => $score,
            'risk_level' => $level,
            'scam_type' => (string) ($decoded['scam_type'] ?? '一般可疑訊息'),
            'summary' => (string) ($decoded['summary'] ?? ''),
            'risk_factors' => array_values(array_filter((array) ($decoded['risk_factors'] ?? []))),
            'suggestions' => array_values(array_filter((array) ($decoded['suggestions'] ?? []))),
            'ai_raw_response' => $rawResponse,
        ];
    }
}
