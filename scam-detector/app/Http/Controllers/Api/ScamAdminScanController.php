<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamCase;
use App\Models\ScamScan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScamAdminScanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = ScamScan::with('user')->latest()->paginate(15);

        return response()->success([
            'items' => $paginator->getCollection()
                ->map(fn (ScamScan $scan) => $this->formatScan($scan))
                ->values(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ], 'admin_scans_retrieved');
    }

    public function convertToCase(ScamScan $scan): JsonResponse
    {
        if (! in_array($scan->risk_level, ['warning', 'danger'], true)) {
            return response()->error('scan_not_convertible', [
                'risk_level' => $scan->risk_level,
            ], 422);
        }

        $title = $this->caseTitleForScan($scan);
        $description = $scan->summary
            ?: $scan->content
            ?: $scan->url
            ?: $scan->ocr_text
            ?: '無描述';

        $sourceUrl = filter_var($scan->url, FILTER_VALIDATE_URL) ? $scan->url : null;

        $case = ScamCase::updateOrCreate(
            ['title' => $title],
            [
                'description' => $description,
                'scam_type' => $scan->scam_type ?: '未知',
                'threat_level' => $scan->risk_level,
                'keywords' => $scan->risk_factors ?? [],
                'method' => $scan->summary,
                'rules' => $scan->suggestions ?? [],
                'source_url' => $sourceUrl,
                'is_active' => true,
            ]
        );

        $scan->is_converted_to_case = true;
        $scan->save();

        return response()->success($case, 'scan_converted_to_case', $case->wasRecentlyCreated ? 201 : 200);
    }

    private function formatScan(ScamScan $scan): array
    {
        return [
            'id' => $scan->id,
            'user_id' => $scan->user_id,
            'user_email' => $scan->user?->email,
            'input_type' => $scan->input_type,
            'content' => $scan->content,
            'url' => $scan->url,
            'image_path' => $scan->image_path,
            'ocr_text' => $scan->ocr_text,
            'risk_level' => $scan->risk_level,
            'risk_score' => $scan->risk_score,
            'scam_type' => $scan->scam_type,
            'summary' => $scan->summary,
            'risk_factors' => $scan->risk_factors ?? [],
            'suggestions' => $scan->suggestions ?? [],
            'converted_to_case' => (bool) $scan->is_converted_to_case,
            'created_at' => $scan->created_at?->format('Y-m-d H:i:s'),
        ];
    }

    private function caseTitleForScan(ScamScan $scan): string
    {
        return sprintf('%s #SCAN-%d', $scan->scam_type ?: '自動收錄案例', $scan->id);
    }
}
