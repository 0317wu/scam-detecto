<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamCase;
use App\Models\ScamScan;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScamDashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $startDate = CarbonImmutable::today()->subDays(6);

        return response()->success([
            'weekly_trend' => $this->weeklyTrend($userId, $startDate),
            'scam_type_distribution' => $this->scamTypeDistribution($userId),
            'risk_level_distribution' => $this->riskLevelDistribution($userId),
            'summary' => $this->summary($userId),
        ], 'stats_retrieved');
    }

    public function cases(): JsonResponse
    {
        $cases = ScamCase::query()
            ->where('is_active', true)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (ScamCase $case) => [
                'id' => $case->id,
                'title' => $case->title,
                'description' => $case->description,
                'scam_type' => $case->scam_type,
                'source_url' => $case->source_url,
                'created_at' => $case->created_at?->format('Y-m-d H:i:s'),
            ])
            ->values();

        return response()->success([
            'cases' => $cases,
        ], 'cases_retrieved');
    }

    private function weeklyTrend(int $userId, CarbonImmutable $startDate): array
    {
        $rows = ScamScan::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('user_id', $userId)
            ->whereDate('created_at', '>=', $startDate->toDateString())
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('count', 'date');

        return collect(range(0, 6))
            ->map(function (int $offset) use ($startDate, $rows) {
                $date = $startDate->addDays($offset)->toDateString();

                return [
                    'date' => $date,
                    'count' => (int) ($rows[$date] ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function scamTypeDistribution(int $userId): array
    {
        return ScamScan::query()
            ->selectRaw('COALESCE(scam_type, ?) as scam_type, COUNT(*) as count', ['未分類'])
            ->where('user_id', $userId)
            ->groupBy('scam_type')
            ->orderByDesc('count')
            ->get()
            ->map(fn (ScamScan $scan) => [
                'scam_type' => $scan->scam_type,
                'count' => (int) $scan->count,
            ])
            ->values()
            ->all();
    }

    private function riskLevelDistribution(int $userId): array
    {
        $counts = ScamScan::query()
            ->selectRaw('risk_level, COUNT(*) as count')
            ->where('user_id', $userId)
            ->groupBy('risk_level')
            ->pluck('count', 'risk_level');

        return collect(['safe', 'warning', 'danger'])
            ->map(fn (string $level) => [
                'risk_level' => $level,
                'count' => (int) ($counts[$level] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function summary(int $userId): array
    {
        return [
            'total_scans' => ScamScan::where('user_id', $userId)->count(),
            'danger_scans' => ScamScan::where('user_id', $userId)->where('risk_level', 'danger')->count(),
            'warning_scans' => ScamScan::where('user_id', $userId)->where('risk_level', 'warning')->count(),
            'safe_scans' => ScamScan::where('user_id', $userId)->where('risk_level', 'safe')->count(),
        ];
    }
}
