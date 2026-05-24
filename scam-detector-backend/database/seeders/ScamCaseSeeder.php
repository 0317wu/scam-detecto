<?php

namespace Database\Seeders;

use App\Models\ScamCase;
use Illuminate\Database\Seeder;

class ScamCaseSeeder extends Seeder
{
    public function run(): void
    {
        $cases = [
            [
                'title' => '假投資群組詐騙',
                'description' => '詐騙集團引導民眾加入 LINE 群組，宣稱保證獲利或內線消息，最後要求匯款到指定帳戶。',
                'scam_type' => '假投資',
            ],
            [
                'title' => '假包裹異常通知',
                'description' => '假冒物流公司傳送包裹異常或補繳費用通知，誘導使用者點擊釣魚連結並輸入個資。',
                'scam_type' => '假包裹',
            ],
            [
                'title' => '假退稅通知',
                'description' => '假冒政府機關通知可領退稅或補助，要求點擊連結填寫身分證字號、銀行帳戶或信用卡資料。',
                'scam_type' => '假退稅',
            ],
            [
                'title' => '解除分期付款詐騙',
                'description' => '假冒客服宣稱訂單誤設分期付款，要求操作 ATM、網銀或提供驗證碼以解除設定。',
                'scam_type' => '解除分期付款',
            ],
            [
                'title' => '釣魚網站登入頁',
                'description' => '以假銀行、假交易平台或假會員中心網頁騙取帳號密碼與一次性驗證碼。',
                'scam_type' => '釣魚網站',
            ],
        ];

        foreach ($cases as $case) {
            ScamCase::updateOrCreate(
                ['title' => $case['title']],
                $case + ['is_active' => true]
            );
        }
    }
}
