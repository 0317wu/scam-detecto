<?php

namespace Tests\Feature;

use App\Models\ScamScan;
use App\Models\User;
use App\Services\OcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ScamAnalysisApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        Config::set('ai.enabled', false);
        Config::set('ai.provider', 'openai');
        Config::set('ai.openai.api_key', null);
        Config::set('ai.gemini.api_key', null);
    }

    public function test_text_analysis_detects_dangerous_investment_message(): void
    {
        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '立即加入 LINE 投資群組，老師帶單保證獲利翻倍，今天截止。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'analysis_completed')
            ->assertJsonPath('data.input_type', 'text')
            ->assertJsonPath('data.risk_level', 'danger')
            ->assertJsonPath('data.scam_type', '假投資詐騙')
            ->assertJsonPath('data.cache_hit', false)
            ->assertJsonPath('data.ai_used', false);

        $this->assertDatabaseHas('scam_scans', [
            'input_type' => 'text',
            'risk_level' => 'danger',
            'scam_type' => '假投資詐騙',
        ]);
    }

    public function test_url_analysis_detects_phishing_url(): void
    {
        $response = $this->postJson('/api/scam/analyze-url', [
            'url' => 'http://secure-bank-login.verify.example.top/account/password',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.input_type', 'url')
            ->assertJsonPath('data.risk_level', 'danger')
            ->assertJsonPath('data.scam_type', '釣魚網站')
            ->assertJsonPath('data.cache_hit', false);

        $this->assertSame(1, ScamScan::where('input_type', 'url')->count());
    }

    public function test_safe_text_returns_low_risk_result(): void
    {
        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '明天下午三點開會，請記得帶報告資料。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.risk_level', 'safe')
            ->assertJsonPath('data.risk_score', 0);
    }

    public function test_authenticated_analysis_is_attached_to_user(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '立即加入 LINE 投資群組，保證獲利。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.user_id', $user->id);

        $this->assertDatabaseHas('scam_scans', [
            'user_id' => $user->id,
            'input_type' => 'text',
        ]);
    }

    public function test_repeated_text_analysis_uses_cache(): void
    {
        $content = '立即加入 LINE 投資群組，保證獲利。';

        $first = $this->postJson('/api/scam/analyze-text', ['content' => $content]);
        $second = $this->postJson('/api/scam/analyze-text', ['content' => $content]);

        $first->assertJsonPath('data.cache_hit', false);
        $second->assertJsonPath('data.cache_hit', true);
        $this->assertSame($first->json('data.risk_score'), $second->json('data.risk_score'));
        $this->assertSame(2, ScamScan::where('input_type', 'text')->count());
    }

    public function test_repeated_url_analysis_uses_cache(): void
    {
        $url = 'http://secure-bank-login.verify.example.top/account/password';

        $first = $this->postJson('/api/scam/analyze-url', ['url' => $url]);
        $second = $this->postJson('/api/scam/analyze-url', ['url' => $url]);

        $first->assertJsonPath('data.cache_hit', false);
        $second->assertJsonPath('data.cache_hit', true);
        $this->assertSame($first->json('data.risk_score'), $second->json('data.risk_score'));
        $this->assertSame(2, ScamScan::where('input_type', 'url')->count());
    }

    public function test_image_analysis_extracts_ocr_text_and_analyzes_it(): void
    {
        Storage::fake('public');
        $this->mockOcrText('立即加入 LINE 投資群組，保證獲利。');

        $response = $this->postJson('/api/scam/analyze-image', [
            'image' => $this->fakePngUpload(),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'analysis_completed')
            ->assertJsonPath('data.input_type', 'image')
            ->assertJsonPath('data.risk_level', 'danger')
            ->assertJsonPath('data.scam_type', '假投資詐騙')
            ->assertJsonPath('data.ocr_text', '立即加入 LINE 投資群組，保證獲利。')
            ->assertJsonPath('data.cache_hit', false);

        $scan = ScamScan::where('input_type', 'image')->firstOrFail();

        $this->assertSame('立即加入 LINE 投資群組，保證獲利。', $scan->ocr_text);
        Storage::disk('public')->assertExists($scan->image_path);
    }

    public function test_openai_analysis_can_enrich_rule_analysis(): void
    {
        Config::set('ai.enabled', true);
        Config::set('ai.provider', 'openai');
        Config::set('ai.openai.api_key', 'test-key');

        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode([
                                'risk_score' => 95,
                                'risk_level' => 'danger',
                                'scam_type' => '假投資詐騙',
                                'summary' => 'AI 判斷此訊息高度疑似假投資詐騙。',
                                'risk_factors' => ['AI 判斷高報酬話術'],
                                'suggestions' => ['不要加入投資群組'],
                            ], JSON_UNESCAPED_UNICODE),
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '加入 LINE 投資群組，保證獲利。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.ai_used', true)
            ->assertJsonPath('data.risk_score', 95)
            ->assertJsonPath('data.summary', 'AI 判斷此訊息高度疑似假投資詐騙。');

        $this->assertNotNull(ScamScan::firstOrFail()->ai_raw_response);
    }

    public function test_gemini_analysis_can_enrich_rule_analysis(): void
    {
        Config::set('ai.enabled', true);
        Config::set('ai.provider', 'gemini');
        Config::set('ai.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'risk_score' => 88,
                                        'risk_level' => 'danger',
                                        'scam_type' => '假投資詐騙',
                                        'summary' => 'Gemini 判斷此訊息疑似假投資詐騙。',
                                        'risk_factors' => ['Gemini 判斷投資群組風險'],
                                        'suggestions' => ['不要匯款給陌生帳戶'],
                                    ], JSON_UNESCAPED_UNICODE),
                                ],
                            ],
                        ],
                    ],
                ],
            ]),
        ]);

        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '加入 LINE 投資群組，保證獲利。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.ai_used', true)
            ->assertJsonPath('data.risk_score', 88)
            ->assertJsonPath('data.summary', 'Gemini 判斷此訊息疑似假投資詐騙。');

        $this->assertNotNull(ScamScan::firstOrFail()->ai_raw_response);
    }

    public function test_ai_failure_falls_back_to_rule_analysis(): void
    {
        Config::set('ai.enabled', true);
        Config::set('ai.provider', 'gemini');
        Config::set('ai.gemini.api_key', 'test-gemini-key');

        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response(['error' => 'server error'], 500),
        ]);

        $response = $this->postJson('/api/scam/analyze-text', [
            'content' => '加入 LINE 投資群組，保證獲利。',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('data.ai_used', false)
            ->assertJsonPath('data.scam_type', '假投資詐騙');
    }

    public function test_image_analysis_requires_image_file(): void
    {
        $this->postJson('/api/scam/analyze-image', ['image' => 'not-an-image'])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'validation_failed')
            ->assertJsonStructure(['errors' => ['image']]);
    }

    public function test_text_analysis_requires_content(): void
    {
        $this->postJson('/api/scam/analyze-text', [])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'validation_failed')
            ->assertJsonStructure(['errors' => ['content']]);
    }

    public function test_url_analysis_requires_valid_url(): void
    {
        $this->postJson('/api/scam/analyze-url', ['url' => 'not-a-url'])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'validation_failed')
            ->assertJsonStructure(['errors' => ['url']]);
    }

    private function mockOcrText(string $text): void
    {
        $this->app->instance(OcrService::class, new class($text) extends OcrService
        {
            public function __construct(private readonly string $text)
            {
            }

            public function extractText(string $imagePath): string
            {
                return $this->text;
            }
        });
    }

    private function fakePngUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'ocr-test-');
        file_put_contents(
            $path,
            base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=')
        );

        return new UploadedFile($path, 'message.png', 'image/png', null, true);
    }
}
