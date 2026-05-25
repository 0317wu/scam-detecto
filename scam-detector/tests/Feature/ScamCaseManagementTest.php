<?php

namespace Tests\Feature;

use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScamCaseManagementTest extends TestCase
{
    use RefreshDatabase;

    /**
     * 測試未登入訪客無法存取案例管理 API
     */
    public function test_guest_cannot_manage_cases(): void
    {
        // 新增
        $this->postJson('/api/scam/cases', [
            'title' => '測試案例',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ])->assertStatus(401);

        $case = ScamCase::create([
            'title' => '測試案例',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ]);

        // 修改
        $this->putJson("/api/scam/cases/{$case->id}", [
            'title' => '更新標題',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ])->assertStatus(401);

        // 刪除
        $this->deleteJson("/api/scam/cases/{$case->id}")
            ->assertStatus(401);
    }

    /**
     * 測試一般登入使用者（非管理員）無法存取案例管理 API
     */
    public function test_non_admin_user_cannot_manage_cases(): void
    {
        $user = User::factory()->create(['is_admin' => false]);
        Sanctum::actingAs($user);

        // 新增
        $this->postJson('/api/scam/cases', [
            'title' => '測試案例',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ])->assertStatus(403);

        $case = ScamCase::create([
            'title' => '測試案例',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ]);

        // 修改
        $this->putJson("/api/scam/cases/{$case->id}", [
            'title' => '更新標題',
            'description' => '描述',
            'scam_type' => '類型',
            'threat_level' => 'warning',
        ])->assertStatus(403);

        // 刪除
        $this->deleteJson("/api/scam/cases/{$case->id}")
            ->assertStatus(403);
    }

    /**
     * 測試系統管理員可以執行案例之新增、修改與刪除
     */
    public function test_admin_user_can_manage_cases(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        Sanctum::actingAs($admin);

        // 1. 測試新增案例
        $response = $this->postJson('/api/scam/cases', [
            'title' => '假投資明牌詐騙',
            'description' => '引導民眾加入 LINE 私密群組',
            'scam_type' => '假投資',
            'threat_level' => 'danger',
            'keywords' => ['穩賺不賠', '加LINE'],
            'method' => '手法說明',
            'rules' => ['防禦規則 1', '防禦規則 2'],
            'source_url' => 'https://165.npa.gov.tw',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', '假投資明牌詐騙');

        $caseId = $response->json('data.id');
        $this->assertDatabaseHas('scam_cases', ['id' => $caseId, 'title' => '假投資明牌詐騙']);

        // 2. 測試修改案例
        $updateResponse = $this->putJson("/api/scam/cases/{$caseId}", [
            'title' => '更新的假投資明牌詐騙',
            'description' => '引導民眾加入 LINE 私密群組 (更新)',
            'scam_type' => '假投資',
            'threat_level' => 'warning',
            'keywords' => ['穩賺不賠', '加LINE', '更新'],
            'method' => '手法說明更新',
            'rules' => ['防禦規則 1'],
            'source_url' => 'https://165.npa.gov.tw',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.title', '更新的假投資明牌詐騙')
            ->assertJsonPath('data.threat_level', 'warning');

        $this->assertDatabaseHas('scam_cases', ['id' => $caseId, 'title' => '更新的假投資明牌詐騙']);

        // 3. 測試刪除案例
        $deleteResponse = $this->deleteJson("/api/scam/cases/{$caseId}");
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('scam_cases', ['id' => $caseId]);
    }
}
