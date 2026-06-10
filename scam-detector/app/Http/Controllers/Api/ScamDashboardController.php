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
        $user = $request->user() ?: $request->user('sanctum');
        $userId = $user?->id;
        $includeAll = (bool) $user?->is_admin;
        $visitorId = $request->input('visitor_id') ?: $request->header('X-Visitor-Id');
        $startDate = CarbonImmutable::today()->subDays(6);

        return response()->success([
            'weekly_trend' => $this->weeklyTrend($userId, $visitorId, $startDate, $includeAll),
            'scam_type_distribution' => $this->scamTypeDistribution($userId, $visitorId, $includeAll),
            'risk_level_distribution' => $this->riskLevelDistribution($userId, $visitorId, $includeAll),
            'summary' => $this->summary($userId, $visitorId, $includeAll),
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
                'threat_level' => $case->threat_level,
                'keywords' => $case->keywords ?? [],
                'method' => $case->method,
                'rules' => $case->rules ?? [],
                'source_url' => $case->source_url,
                'created_at' => $case->created_at?->format('Y-m-d H:i:s'),
            ])
            ->values();

        return response()->success([
            'cases' => $cases,
        ], 'cases_retrieved');
    }

    /**
     * 套用擁有者過濾（已登入使用者或訪客識別碼）
     */
    private function applyOwnerQuery($query, ?int $userId, ?string $visitorId, bool $includeAll = false)
    {
        if ($includeAll) {
            return $query;
        }

        if ($userId && $visitorId) {
            return $query->where(function ($query) use ($userId, $visitorId) {
                $query
                    ->where('user_id', $userId)
                    ->orWhere(function ($query) use ($visitorId) {
                        $query->whereNull('user_id')->where('visitor_id', $visitorId);
                    });
            });
        }

        if ($userId) {
            return $query->where('user_id', $userId);
        }

        if ($visitorId) {
            return $query->whereNull('user_id')->where('visitor_id', $visitorId);
        }

        return $query->whereRaw('1 = 0');
    }

    private function weeklyTrend(?int $userId, ?string $visitorId, CarbonImmutable $startDate, bool $includeAll): array
    {
        $query = ScamScan::query()
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->whereDate('created_at', '>=', $startDate->toDateString())
            ->groupBy(DB::raw('DATE(created_at)'));

        $this->applyOwnerQuery($query, $userId, $visitorId, $includeAll);
        $rows = $query->pluck('count', 'date');

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

    private function scamTypeDistribution(?int $userId, ?string $visitorId, bool $includeAll): array
    {
        $query = ScamScan::query()
            ->selectRaw('COALESCE(scam_type, ?) as scam_type, COUNT(*) as count', ['未分類'])
            ->groupBy('scam_type')
            ->orderByDesc('count');

        $this->applyOwnerQuery($query, $userId, $visitorId, $includeAll);

        return $query->get()
            ->map(fn (ScamScan $scan) => [
                'scam_type' => $scan->scam_type,
                'count' => (int) $scan->count,
            ])
            ->values()
            ->all();
    }

    private function riskLevelDistribution(?int $userId, ?string $visitorId, bool $includeAll): array
    {
        $query = ScamScan::query()
            ->selectRaw('risk_level, COUNT(*) as count')
            ->groupBy('risk_level');

        $this->applyOwnerQuery($query, $userId, $visitorId, $includeAll);
        $counts = $query->pluck('count', 'risk_level');

        return collect(['safe', 'warning', 'danger'])
            ->map(fn (string $level) => [
                'risk_level' => $level,
                'count' => (int) ($counts[$level] ?? 0),
            ])
            ->values()
            ->all();
    }

    private function summary(?int $userId, ?string $visitorId, bool $includeAll): array
    {
        $totalQuery = ScamScan::query();
        $this->applyOwnerQuery($totalQuery, $userId, $visitorId, $includeAll);

        $dangerQuery = ScamScan::query()->where('risk_level', 'danger');
        $this->applyOwnerQuery($dangerQuery, $userId, $visitorId, $includeAll);

        $warningQuery = ScamScan::query()->where('risk_level', 'warning');
        $this->applyOwnerQuery($warningQuery, $userId, $visitorId, $includeAll);

        $safeQuery = ScamScan::query()->where('risk_level', 'safe');
        $this->applyOwnerQuery($safeQuery, $userId, $visitorId, $includeAll);

        return [
            'total_scans' => $totalQuery->count(),
            'danger_scans' => $dangerQuery->count(),
            'warning_scans' => $warningQuery->count(),
            'safe_scans' => $safeQuery->count(),
        ];
    }
}
