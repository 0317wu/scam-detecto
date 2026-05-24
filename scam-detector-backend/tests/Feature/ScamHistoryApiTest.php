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

    public function test_guest_cannot_access_history(): void
    {
        $this->getJson('/api/scam/history')
            ->assertUnauthorized()
            ->assertJsonPath('message', 'unauthenticated');
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
