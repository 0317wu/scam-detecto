<?php

namespace Tests\Feature;

use App\Models\ScamScan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScamHistoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_history_with_visitor_id(): void
    {
        $visitorId = 'v-test-visitor-1234';

        // 建立一筆訪客掃描紀錄
        ScamScan::create([
            'visitor_id' => $visitorId,
            'input_type' => 'text',
            'content' => '訪客測試訊息',
            'risk_score' => 70,
            'risk_level' => 'warning',
            'scam_type' => '假包裹',
            'summary' => '摘要',
        ]);

        // 不帶 visitor_id 時，應回傳空列表（成功但無資料）
        $this->getJson('/api/scam/history')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(0, 'data.items');

        // 帶有 visitor_id 時，應回傳對應的歷史紀錄
        $this->getJson("/api/scam/history?visitor_id={$visitorId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.content', '訪客測試訊息');
    }

    public function test_user_can_list_only_own_history_with_pagination(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createScan($user, [
            'content' => '加入 LINE 投資群組',
            'scam_type' => '假投資詐騙',
            'risk_level' => 'danger',
        ]);
        $this->createScan($user, [
            'content' => '明天下午開會',
            'scam_type' => '一般可疑訊息',
            'risk_level' => 'safe',
        ]);
        $this->createScan($otherUser, [
            'content' => '別人的紀錄',
            'scam_type' => '假包裹',
            'risk_level' => 'warning',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/scam/history?per_page=5');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'history_retrieved')
            ->assertJsonPath('data.pagination.total', 2)
            ->assertJsonCount(2, 'data.items');

        $this->assertSame(
            [$user->id, $user->id],
            array_column($response->json('data.items'), 'user_id')
        );
    }

    public function test_bearer_token_user_can_list_own_history(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('api-token')->plainTextToken;

        $this->createScan($user, [
            'content' => '限時投資機會，保證獲利，加入 LINE。',
            'risk_level' => 'danger',
        ]);

        $response = $this
            ->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/scam/history?per_page=5');

        $response
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.user_id', $user->id);
    }

    public function test_authenticated_user_with_visitor_id_can_list_own_and_visitor_history(): void
    {
        $user = User::factory()->create();
        $visitorId = 'v-browser-session-1234';

        $this->createScan($user, [
            'content' => '登入使用者紀錄',
            'risk_level' => 'warning',
        ]);

        ScamScan::create([
            'visitor_id' => $visitorId,
            'input_type' => 'text',
            'content' => '同一瀏覽器訪客紀錄',
            'risk_score' => 95,
            'risk_level' => 'danger',
            'scam_type' => '假退稅詐騙',
            'summary' => '測試摘要',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson("/api/scam/history?visitor_id={$visitorId}&per_page=5");

        $response
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 2);

        $this->assertEqualsCanonicalizing(
            ['同一瀏覽器訪客紀錄', '登入使用者紀錄'],
            array_column($response->json('data.items'), 'content')
        );
    }

    public function test_user_can_search_history(): void
    {
        $user = User::factory()->create();
        $this->createScan($user, [
            'content' => '加入 LINE 投資群組',
            'scam_type' => '假投資詐騙',
            'risk_level' => 'danger',
        ]);
        $this->createScan($user, [
            'content' => '一般會議通知',
            'scam_type' => '一般可疑訊息',
            'risk_level' => 'safe',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/scam/history?search=LINE');

        $response
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.scam_type', '假投資詐騙');
    }

    public function test_user_can_filter_history_by_risk_level(): void
    {
        $user = User::factory()->create();
        $this->createScan($user, ['risk_level' => 'danger']);
        $this->createScan($user, ['risk_level' => 'safe']);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/scam/history?risk_level=danger');

        $response
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.risk_level', 'danger');
    }

    public function test_user_can_view_own_history_detail(): void
    {
        $user = User::factory()->create();
        $scan = $this->createScan($user, [
            'content' => '加入 LINE 投資群組',
            'risk_factors' => ['引導加入 LINE 或私訊群組'],
        ]);

        Sanctum::actingAs($user);

        $this->getJson("/api/scam/history/{$scan->id}")
            ->assertOk()
            ->assertJsonPath('message', 'history_detail_retrieved')
            ->assertJsonPath('data.id', $scan->id)
            ->assertJsonPath('data.risk_factors.0', '引導加入 LINE 或私訊群組');
    }

    public function test_history_marks_scan_that_was_converted_to_case(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['is_admin' => true]);
        $scan = $this->createScan($user, [
            'scam_type' => '假退稅詐騙',
            'risk_level' => 'danger',
        ]);

        $this->actingAs($admin)
            ->postJson("/api/scam/scans/{$scan->id}/case")
            ->assertCreated();

        Sanctum::actingAs($user);

        $this->getJson('/api/scam/history?per_page=5')
            ->assertOk()
            ->assertJsonPath('data.items.0.converted_to_case', true);
    }

    public function test_user_cannot_view_other_users_history_detail(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $scan = $this->createScan($otherUser);

        Sanctum::actingAs($user);

        $this->getJson("/api/scam/history/{$scan->id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'scan_not_found');
    }

    private function createScan(User $user, array $attributes = []): ScamScan
    {
        return ScamScan::create(array_merge([
            'user_id' => $user->id,
            'input_type' => 'text',
            'content' => '測試訊息',
            'risk_score' => 80,
            'risk_level' => 'danger',
            'scam_type' => '假投資詐騙',
            'summary' => '測試摘要',
            'risk_factors' => ['測試風險因子'],
            'suggestions' => ['測試建議'],
        ], $attributes));
    }
}
