<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SystemSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed the database to ensure cases and stats can be rendered
        $this->artisan('db:seed');
    }

    public function test_dashboard_page_loads_successfully()
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard')
        );
    }

    public function test_knowledge_page_loads_successfully()
    {
        $response = $this->get('/knowledge');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Knowledge')
        );
    }

    public function test_history_page_loads_successfully()
    {
        $response = $this->get('/history');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('History')
        );
    }

    public function test_cases_manager_page_is_protected()
    {
        // Guest gets redirected to login
        $response = $this->get('/cases-manager');
        $response->assertRedirect('/login');

        // Regular user gets 403
        $user = User::factory()->create(['is_admin' => false]);
        $response = $this->actingAs($user)->get('/cases-manager');
        $response->assertStatus(403);

        // Admin gets 200 and Inertia component
        $admin = User::factory()->create(['is_admin' => true]);
        $response = $this->actingAs($admin)->get('/cases-manager');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('CasesManager')
        );
    }

    public function test_scans_manager_page_is_protected()
    {
        // Guest gets redirected to login
        $response = $this->get('/scans-manager');
        $response->assertRedirect('/login');

        // Regular user gets 403
        $user = User::factory()->create(['is_admin' => false]);
        $response = $this->actingAs($user)->get('/scans-manager');
        $response->assertStatus(403);

        // Admin gets 200 and Inertia component
        $admin = User::factory()->create(['is_admin' => true]);
        $response = $this->actingAs($admin)->get('/scans-manager');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('ScansManager')
        );
    }

    public function test_api_config_endpoint_is_accessible()
    {
        $response = $this->getJson('/api/scam/config');

        $response->assertStatus(200);
        $response->assertJsonStructure(['has_ai_key']);
    }
}
