<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_a_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_guest_visiting_protected_web_page_is_redirected_to_login(): void
    {
        // /cases-manager 現在是受保護的網頁，未登入訪客應被重導至登入頁
        $this->get('/cases-manager')
            ->assertRedirect('/login');
    }
}
