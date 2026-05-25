<?php

namespace Tests\Feature;

use App\Models\ScamCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class ScamDatabaseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_scam_case_clears_cache()
    {
        Cache::put('dynamic_scam_rules', ['rule1', 'rule2'], 600);
        $this->assertTrue(Cache::has('dynamic_scam_rules'));

        // 建立管理員以通過中介層
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $payload = [
            'title' => 'Test Scam Case',
            'description' => 'This is a test description.',
            'scam_type' => 'phishing',
            'threat_level' => 'danger',
            'keywords' => ['test'],
            'rules' => ['rule1'],
        ];

        $response = $this->actingAs($admin)->postJson('/api/scam/cases', $payload);

        $response->assertStatus(201);
        $this->assertFalse(Cache::has('dynamic_scam_rules'));
    }

    public function test_updating_scam_case_clears_cache()
    {
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $case = ScamCase::create([
            'title' => 'Old Title',
            'description' => 'Old description.',
            'scam_type' => 'phishing',
            'threat_level' => 'danger',
        ]);

        Cache::put('dynamic_scam_rules', ['rule1'], 600);
        $this->assertTrue(Cache::has('dynamic_scam_rules'));

        $payload = [
            'title' => 'New Title',
            'description' => 'New description.',
            'scam_type' => 'phishing',
            'threat_level' => 'danger',
        ];

        $response = $this->actingAs($admin)->putJson("/api/scam/cases/{$case->id}", $payload);

        $response->assertStatus(200);
        $this->assertFalse(Cache::has('dynamic_scam_rules'));
    }

    public function test_deleting_scam_case_clears_cache()
    {
        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $case = ScamCase::create([
            'title' => 'To be deleted',
            'description' => 'Will be deleted.',
            'scam_type' => 'phishing',
            'threat_level' => 'danger',
        ]);

        Cache::put('dynamic_scam_rules', ['rule1'], 600);
        $this->assertTrue(Cache::has('dynamic_scam_rules'));

        $response = $this->actingAs($admin)->deleteJson("/api/scam/cases/{$case->id}");

        $response->assertStatus(200);
    }

    public function test_rule_helper_loads_dynamic_rules_from_database()
    {
        Cache::forget('dynamic_scam_rules');

        $case = ScamCase::create([
            'title' => 'Dynamic Rule Test',
            'description' => 'Dynamic Rule Test Description',
            'scam_type' => 'phishing',
            'threat_level' => 'danger',
            'keywords' => ['super_secret_scam_keyword'],
        ]);

        $helper = new \App\Helpers\RuleHelper();
        $matches = $helper->detectTextRules('This is a super_secret_scam_keyword test.');

        $this->assertNotEmpty($matches);
        
        $found = false;
        foreach ($matches as $match) {
            if ($match['weight'] === 30 && isset($match['factor']) && $match['factor'] === 'Dynamic Rule Test') {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'Dynamic rule with weight 30 should be matched.');
    }
}
