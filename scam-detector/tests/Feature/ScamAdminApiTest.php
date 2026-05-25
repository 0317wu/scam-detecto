<?php

namespace Tests\Feature;

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
                    '*' => ['id', 'user_id', 'user_email', 'input_type', 'content', 'risk_score', 'risk_level', 'scam_type', 'created_at']
                ],
                'pagination' => [
                    'current_page',
                    'last_page',
                    'per_page',
                    'total'
                ]
            ]
        ]);
        
        $response->assertJsonCount(15, 'data.items');
    }
}
