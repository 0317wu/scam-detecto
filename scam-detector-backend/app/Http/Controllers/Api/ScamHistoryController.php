<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamScan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScamHistoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'risk_level' => ['nullable', 'in:safe,warning,danger'],
            'input_type' => ['nullable', 'in:text,url,image'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            'visitor_id' => ['nullable', 'string', 'max:36'],
        ]);

        $perPage = (int) ($validated['per_page'] ?? 5);

        // 取得已登入使用者或訪客識別碼
        $user = $request->user() ?: $request->user('sanctum');
        $visitorId = $validated['visitor_id'] ?? $request->header('X-Visitor-Id');

        $query = ScamScan::query();

        if ($user) {
            $query->where('user_id', $user->id);
        } elseif ($visitorId) {
            $query->whereNull('user_id')->where('visitor_id', $visitorId);
        } else {
            // 若皆無，則不回傳任何紀錄
            $query->whereRaw('1 = 0');
        }

        $query->latest();

        if (! empty($validated['risk_level'])) {
            $query->where('risk_level', $validated['risk_level']);
        }

        if (! empty($validated['input_type'])) {
            $query->where('input_type', $validated['input_type']);
        }

        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where(function ($query) use ($search) {
                $query
                    ->where('content', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%")
                    ->orWhere('ocr_text', 'like', "%{$search}%")
                    ->orWhere('scam_type', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        $paginator = $query->paginate($perPage);

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
        ], 'history_retrieved');
    }

    public function show(Request $request, ScamScan $scan): JsonResponse
    {
        $user = $request->user() ?: $request->user('sanctum');
        $visitorId = $request->input('visitor_id') ?: $request->header('X-Visitor-Id');

        if ($user) {
            if ($scan->user_id !== $user->id) {
                return response()->error('scan_not_found', null, 404);
            }
        } elseif ($visitorId) {
            if ($scan->user_id !== null || $scan->visitor_id !== $visitorId) {
                return response()->error('scan_not_found', null, 404);
            }
        } else {
            return response()->error('scan_not_found', null, 404);
        }

        return response()->success($this->formatScan($scan), 'history_detail_retrieved');
    }

    /**
     * @return array<string, mixed>
     */
    private function formatScan(ScamScan $scan): array
    {
        return [
            'id' => $scan->id,
            'user_id' => $scan->user_id,
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
            'ai_used' => $scan->ai_raw_response !== null,
            'created_at' => $scan->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
