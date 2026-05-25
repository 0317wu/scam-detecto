<?php

namespace App\Helpers;

use App\Models\ScamCase;
use Illuminate\Support\Facades\Cache;

class RuleHelper
{
    public function detectTextRules(string $content): array
    {
        $rules = [
            ['factor' => '引導加入 LINE 或私訊群組', 'weight' => 25, 'scam_type' => '假投資詐騙', 'patterns' => ['line', '加入群組', '私訊', '加好友', '投資群']],
            ['factor' => '承諾高報酬或保證獲利', 'weight' => 30, 'scam_type' => '假投資詐騙', 'patterns' => ['保證獲利', '穩賺', '高報酬', '翻倍', '內線', '老師帶單']],
            ['factor' => '使用急迫性話術', 'weight' => 18, 'patterns' => ['立即', '馬上', '限時', '最後機會', '逾期', '今日截止']],
            ['factor' => '要求提供個人或金融資料', 'weight' => 28, 'patterns' => ['身分證', '信用卡', '銀行帳戶', '驗證碼', '密碼', 'otp']],
            ['factor' => '要求匯款或操作 ATM', 'weight' => 30, 'scam_type' => '解除分期付款詐騙', 'patterns' => ['匯款', 'atm', '轉帳', '解除分期', '設定錯誤']],
            ['factor' => '疑似假冒政府、銀行或物流單位', 'weight' => 22, 'patterns' => ['政府', '銀行', '客服', '物流', '包裹', '退稅', '補助']],
            ['factor' => '含有可疑連結', 'weight' => 20, 'patterns' => ['http://', 'https://', 'www.', '.top', '.xyz', '.vip']],
        ];

        $dynamicRules = Cache::remember('dynamic_scam_rules', 86400, function () {
            return ScamCase::whereIn('threat_level', ['danger', 'warning'])
                ->whereNotNull('keywords')
                ->get(['title', 'scam_type', 'threat_level', 'keywords'])
                ->map(function ($case) {
                    $weight = match ($case->threat_level) {
                        'danger' => 30,
                        'warning' => 20,
                        default => 0,
                    };

                    if ($weight === 0) {
                        return null;
                    }

                    $keywords = is_array($case->keywords) ? $case->keywords : explode(',', (string) $case->keywords);
                    $patterns = array_filter(array_map('trim', $keywords));

                    if (empty($patterns)) {
                        return null;
                    }

                    return [
                        'factor' => $case->title,
                        'weight' => $weight,
                        'scam_type' => $case->scam_type,
                        'patterns' => array_values($patterns),
                    ];
                })->filter()->values()->toArray();
        });

        $rules = array_merge($rules, $dynamicRules);

        return $this->matchRules($content, $rules);
    }

    public function detectUrlRules(string $url): array
    {
        $host = parse_url($url, PHP_URL_HOST) ?: $url;
        $rules = [
            ['factor' => '使用非 HTTPS 或不完整網址', 'weight' => 22, 'patterns' => ['http://']],
            ['factor' => '使用高風險網域後綴', 'weight' => 25, 'scam_type' => '釣魚網站', 'patterns' => ['.top', '.xyz', '.vip', '.click', '.work', '.shop']],
            ['factor' => '疑似短網址或跳轉服務', 'weight' => 24, 'scam_type' => '釣魚網站', 'patterns' => ['bit.ly', 'tinyurl', 'reurl.cc', 'shorturl', 't.co']],
            ['factor' => '網域疑似假冒金融或官方服務', 'weight' => 30, 'scam_type' => '釣魚網站', 'patterns' => ['bank', 'login', 'verify', 'secure', 'gov', 'tw-bank', 'atm']],
            ['factor' => '網址包含可疑登入或驗證路徑', 'weight' => 20, 'scam_type' => '釣魚網站', 'patterns' => ['password', 'otp', 'account', 'signin', 'auth']],
            ['factor' => '網域層級過多，可能混淆真實來源', 'weight' => substr_count($host, '.') >= 3 ? 18 : 0, 'patterns' => [$host]],
        ];

        return array_values(array_filter(
            $this->matchRules(strtolower($url), $rules),
            fn (array $match) => $match['weight'] > 0
        ));
    }

    private function matchRules(string $value, array $rules): array
    {
        $normalizedValue = mb_strtolower($value);
        $matches = [];

        foreach ($rules as $rule) {
            foreach ($rule['patterns'] as $pattern) {
                if (str_contains($normalizedValue, mb_strtolower($pattern))) {
                    $matches[] = [
                        'factor' => $rule['factor'],
                        'weight' => $rule['weight'],
                        'scam_type' => $rule['scam_type'] ?? null,
                    ];
                    break;
                }
            }
        }

        return $matches;
    }
}
