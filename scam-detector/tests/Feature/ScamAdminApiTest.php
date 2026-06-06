<?php

namespace Tests\Feature;

use App\Models\ScamCase;
use App\Models\ScamScan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScamAdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_get_all_scans()
    {
        // 建立普通用戶和管理員
        $user = User::factory()->create(['is_admin' => false]);
        $admin = User::factory()->create(['is_admin' => true]);

        // 建立一些掃描紀錄
        ScamScan::factory()->count(20)->create([
            'user_id' => $user->id,
            'summary' => 'AI 判斷此訊息疑似詐騙。',
            'risk_factors' => ['高報酬話術', '要求加入 LINE'],
            'suggestions' => ['不要轉帳', '撥打 165 查證'],
        ]);

        // 測試普通用戶無法訪問
        $response = $this->actingAs($user)
            ->getJson('/api/scam/scans');

        $response->assertStatus(403);

        // 測試管理員可以訪問
        $response = $this->actingAs($admin)
            ->getJson('/api/scam/scans');

        $response->assertStatus(200);

        // 驗證是否分頁返回，且第一頁數量為 15
        $response->assertJsonStructure([
            'data' => [
                'items' => [
                    '*' => [
                        'id',
                        'user_id',
                        'user_email',
                        'input_type',
                        'content',
                        'ocr_text',
                        'risk_score',
                        'risk_level',
                        'scam_type',
                        'summary',
                        'risk_factors',
                        'suggestions',
                        'converted_to_case',
                        'created_at',
                    ],
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total',
                ],
            ],
        ]);

        $response->assertJsonCount(15, 'data.items');
        $response
            ->assertJsonPath('data.items.0.summary', 'AI 判斷此訊息疑似詐騙。')
            ->assertJsonPath('data.items.0.risk_factors.0', '高報酬話術')
            ->assertJsonPath('data.items.0.suggestions.0', '不要轉帳')
            ->assertJsonPath('data.items.0.converted_to_case', false);
    }

    public function test_only_admin_can_convert_scan_to_case(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        $scan = ScamScan::factory()->create([
            'risk_level' => 'danger',
            'scam_type' => '假退稅詐騙',
        ]);

        $this->actingAs($user)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertForbidden();

        $this->assertDatabaseCount('scam_cases', 0);
    }

    public function test_admin_can_convert_high_risk_scan_to_case(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $scan = ScamScan::factory()->create([
            'input_type' => 'text',
            'content' => '請立即輸入銀行帳戶與驗證碼領取退稅',
            'risk_level' => 'danger',
            'risk_score' => 100,
            'scam_type' => '假退稅詐騙',
            'summary' => '要求提供金融資料的假退稅釣魚訊息。',
            'risk_factors' => ['要求提供個資', '使用急迫性話術'],
            'suggestions' => ['不要輸入帳戶資料', '撥打 165 查證'],
        ]);

        $this->actingAs($admin)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertCreated()
            ->assertJsonPath('message', 'scan_converted_to_case')
            ->assertJsonPath('data.title', "假退稅詐騙 #SCAN-{$scan->id}")
            ->assertJsonPath('data.description', '要求提供金融資料的假退稅釣魚訊息。')
            ->assertJsonPath('data.keywords.0', '要求提供個資')
            ->assertJsonPath('data.rules.0', '不要輸入帳戶資料')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('scam_cases', [
            'title' => "假退稅詐騙 #SCAN-{$scan->id}",
            'scam_type' => '假退稅詐騙',
            'threat_level' => 'danger',
        ]);
    }

    public function test_converting_same_scan_updates_existing_case_without_duplicate(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $scan = ScamScan::factory()->create([
            'risk_level' => 'warning',
            'scam_type' => '假投資詐騙',
            'summary' => '第一次摘要',
            'risk_factors' => ['保證獲利'],
        ]);

        $this->actingAs($admin)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertCreated();

        $scan->update([
            'summary' => '更新後摘要',
            'risk_factors' => ['高報酬話術'],
        ]);

        $this->actingAs($admin)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertOk()
            ->assertJsonPath('data.description', '更新後摘要')
            ->assertJsonPath('data.keywords.0', '高報酬話術');

        $this->assertSame(1, ScamCase::where('title', "假投資詐騙 #SCAN-{$scan->id}")->count());
    }

    public function test_admin_cannot_convert_safe_scan_to_case(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $scan = ScamScan::factory()->create([
            'risk_level' => 'safe',
            'scam_type' => '正常訊息',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertStatus(422)
            ->assertJsonPath('message', 'scan_not_convertible');

        $this->assertDatabaseCount('scam_cases', 0);
    }
}
