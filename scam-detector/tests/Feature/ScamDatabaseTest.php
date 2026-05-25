<?php

namespace Tests\Feature;

use App\Models\ScamCase;
use App\Models\ScamScan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScamDatabaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_scam_scan_can_store_analysis_result(): void
    {
        $user = User::factory()->create();

        $scan = ScamScan::create([
            'user_id' => $user->id,
            'input_type' => 'text',
            'content' => '加入 LINE 投資群組，保證獲利。',
            'risk_score' => 92,
            'risk_level' => 'danger',
            'scam_type' => '假投資詐騙',
            'summary' => '此訊息高度疑似假投資詐騙。',
            'risk_factors' => ['引導加入 LINE', '承諾高報酬'],
            'suggestions' => ['不要匯款', '建議撥打 165 查證'],
        ]);

        $this->assertSame('danger', $scan->risk_level);
        $this->assertSame(['引導加入 LINE', '承諾高報酬'], $scan->risk_factors);
        $this->assertTrue($user->scamScans()->whereKey($scan->id)->exists());
    }

    public function test_scam_case_seeder_creates_initial_cases(): void
    {
        $this->seed();

        $this->assertGreaterThanOrEqual(5, ScamCase::count());
        $this->assertDatabaseHas('scam_cases', [
            'title' => '假投資群組詐騙',
            'is_active' => true,
        ]);

        $case = ScamCase::where('title', '假投資群組詐騙')->firstOrFail();

        $this->assertSame('danger', $case->threat_level);
        $this->assertContains('保證獲利', $case->keywords);
        $this->assertNotEmpty($case->method);
        $this->assertGreaterThanOrEqual(3, count($case->rules));
    }
}
