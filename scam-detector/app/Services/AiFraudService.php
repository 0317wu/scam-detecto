<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class AiFraudService
{
    public function isEnabled(): bool
    {
        if (! (bool) config('ai.enabled')) {
            return false;
        }

        return match (config('ai.provider')) {
            'gemini' => filled(config('ai.gemini.api_key')),
            default => filled(config('ai.openai.api_key')),
        };
    }

    public function analyze(string $inputType, string $content, array $ruleAnalysis): ?array
    {
        if (! $this->isEnabled()) {
            return null;
        }

        try {
            return match (config('ai.provider')) {
                'gemini' => $this->callGemini($inputType, $content, $ruleAnalysis),
                default => $this->callOpenAi($inputType, $content, $ruleAnalysis),
            };
        } catch (Throwable $e) {
            Log::warning('AI Request Failed', ['msg' => $e->getMessage()]);
            return null;
        }
    }

    private function callOpenAi(string $inputType, string $content, array $ruleAnalysis): array
    {
        $response = $this->httpClient()
            ->withToken(config('ai.openai.api_key'))
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
                        'content' => $this->payloadJson($inputType, $content, $ruleAnalysis),
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

    private function callGemini(string $inputType, string $content, array $ruleAnalysis): array
    {
        $url = sprintf(
            '%s/models/%s:generateContent?key=%s',
            config('ai.gemini.base_url'),
            config('ai.gemini.model'),
            config('ai.gemini.api_key')
        );

        $response = $this->httpClient()
            ->acceptJson()
            ->post($url, [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            [
                                'text' => $this->systemPrompt()."\n\n".$this->payloadJson($inputType, $content, $ruleAnalysis),
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'response_mime_type' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('ai_request_failed');
        }

        $content = $response->json('candidates.0.content.parts.0.text');
        $decoded = is_string($content) ? json_decode($content, true) : null;

        if (! is_array($decoded)) {
            throw new RuntimeException('ai_invalid_json');
        }

        return $this->normalize($decoded, $response->json());
    }

    private function httpClient()
    {
        $client = Http::timeout(config('ai.timeout'));

        if (! (bool) config('ai.ssl_verify')) {
            return $client->withoutVerifying();
        }

        return $client;
    }

    private function payloadJson(string $inputType, string $content, array $ruleAnalysis): string
    {
        return json_encode([
            'input_type' => $inputType,
            'content' => $content,
            'rule_analysis' => $ruleAnalysis,
        ], JSON_UNESCAPED_UNICODE);
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
