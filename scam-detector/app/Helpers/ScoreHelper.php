<?php

namespace App\Helpers;

class ScoreHelper
{
    public function calculateRiskScore(array $matches): int
    {
        $score = array_sum(array_column($matches, 'weight'));

        if (count($matches) >= 3) {
            $score += 10;
        }

        return min(100, max(0, $score));
    }

    public function determineRiskLevel(int $score): string
    {
        return match (true) {
            $score >= 70 => 'danger',
            $score >= 35 => 'warning',
            default => 'safe',
        };
    }

    public function determineScamType(array $matches): string
    {
        $types = array_filter(array_column($matches, 'scam_type'));

        if ($types === []) {
            return '一般可疑訊息';
        }

        $counts = array_count_values($types);
        arsort($counts);

        return array_key_first($counts);
    }

    public function suggestionsForLevel(string $riskLevel): array
    {
        return match ($riskLevel) {
            'danger' => [
                '不要點擊連結或加入陌生群組',
                '不要匯款或提供信用卡、身分證、驗證碼',
                '請改從官方網站或官方客服查證',
                '必要時撥打 165 反詐騙專線確認',
            ],
            'warning' => [
                '先不要提供個人資料',
                '確認網址是否為官方網域',
                '向官方客服或 165 查證後再操作',
            ],
            default => [
                '目前未偵測到明顯高風險特徵',
                '仍建議確認來源是否可信',
            ],
        };
    }
}
