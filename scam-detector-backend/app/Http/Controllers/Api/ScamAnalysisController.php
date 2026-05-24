<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamScan;
use App\Services\FraudService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScamAnalysisController extends Controller
{
    public function __construct(
        private readonly FraudService $fraudService,
    ) {
    }

    public function analyzeText(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => ['required', 'string', 'min:2', 'max:5000'],
        ]);

        $result = $this->fraudService->analyzeText($validated['content'], $request->user());

        return response()->success(
            $this->formatScan($result['scan'], $result['cache_hit']),
            'analysis_completed'
        );
    }

    public function analyzeUrl(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'url' => ['required', 'url', 'max:2048'],
        ]);

        $result = $this->fraudService->analyzeUrl($validated['url'], $request->user());

        return response()->success(
            $this->formatScan($result['scan'], $result['cache_hit']),
            'analysis_completed'
        );
    }

    public function analyzeImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $result = $this->fraudService->analyzeImage($validated['image'], $request->user());

        return response()->success(
            $this->formatScan($result['scan'], $result['cache_hit']),
            'analysis_completed'
        );
    }

    private function formatScan(ScamScan $scan, bool $cacheHit): array
    {
        return [
            'id' => $scan->id,
            'user_id' => $scan->user_id,
            'input_type' => $scan->input_type,
            'risk_level' => $scan->risk_level,
            'risk_score' => $scan->risk_score,
            'scam_type' => $scan->scam_type,
            'summary' => $scan->summary,
            'ocr_text' => $scan->ocr_text,
            'image_path' => $scan->image_path,
            'ai_used' => $scan->ai_raw_response !== null,
            'risk_factors' => $scan->risk_factors ?? [],
            'suggestions' => $scan->suggestions ?? [],
            'cache_hit' => $cacheHit,
            'created_at' => $scan->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
