<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamScan;
use Illuminate\Http\Request;

class ScamAdminScanController extends Controller
{
    public function index(Request $request)
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
            'risk_level' => $scan->risk_level,
            'risk_score' => $scan->risk_score,
            'scam_type' => $scan->scam_type,
            'created_at' => $scan->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
