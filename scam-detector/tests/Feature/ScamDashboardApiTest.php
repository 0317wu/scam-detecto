<?php

namespace Tests\Feature;

use App\Models\ScamScan;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScamDashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_access_stats_with_visitor_id(): void
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
            'created_at' => CarbonImmutable::today(),
        ]);

        // 不帶 visitor_id 時，應回傳空統計（皆為 0）
        $this->getJson('/api/scam/stats')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_scans', 0);

        // 帶有 visitor_id 時，應回傳對應的統計
        $this->getJson("/api/scam/stats?visitor_id={$visitorId}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.summary.total_scans', 1)
            ->assertJsonPath('data.summary.warning_scans', 1);
    }

    public function test_user_can_get_own_stats(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $this->createScan($user, [
            'risk_level' => 'danger',
            'risk_score' => 90,
            'scam_type' => '假投資詐騙',
            'created_at' => CarbonImmutable::today(),
        ]);
        $this->createScan($user, [
            'risk_level' => 'warning',
            'risk_score' => 50,
            'scam_type' => '釣魚網站',
            'created_at' => CarbonImmutable::today()->subDay(),
        ]);
        $this->createScan($user, [
            'risk_level' => 'safe',
            'risk_score' => 10,
            'scam_type' => '一般可疑訊息',
            'created_at' => CarbonImmutable::today()->subDays(6),
        ]);
        $this->createScan($otherUser, [
            'risk_level' => 'danger',
            'risk_score' => 99,
            'scam_type' => '別人的紀錄',
            'created_at' => CarbonImmutable::today(),
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/scam/stats');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'stats_retrieved')
            ->assertJsonPath('data.summary.total_scans', 3)
            ->assertJsonPath('data.summary.danger_scans', 1)
            ->assertJsonPath('data.summary.warning_scans', 1)
            ->assertJsonPath('data.summary.safe_scans', 1)
            ->assertJsonCount(7, 'data.weekly_trend')
            ->assertJsonFragment([
                'scam_type' => '假投資詐騙',
                'count' => 1,
            ])
            ->assertJsonFragment([
                'risk_level' => 'danger',
                'count' => 1,
            ]);
    }

    public function test_cases_api_returns_active_seeded_cases(): void
    {
        $this->seed();

        $response = $this->getJson('/api/scam/cases');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'cases_retrieved')
            ->assertJsonStructure([
                'data' => [
                    'cases' => [
                        '*' => [
                            'id',
                            'title',
                            'description',
                            'scam_type',
                            'threat_level',
                            'keywords',
                            'method',
                            'rules',
                            'source_url',
                            'created_at',
                        ],
                    ],
                ],
            ])
            ->assertJsonFragment([
                'title' => '假投資群組詐騙',
                'threat_level' => 'danger',
            ]);
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
