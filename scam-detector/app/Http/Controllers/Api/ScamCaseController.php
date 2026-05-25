<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScamCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScamCaseController extends Controller
{
    /**
     * 儲存新建立的防詐案例
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'scam_type' => ['required', 'string', 'max:100'],
            'threat_level' => ['required', 'string', 'in:safe,warning,danger'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'method' => ['nullable', 'string'],
            'rules' => ['nullable', 'array'],
            'rules.*' => ['string'],
            'source_url' => ['nullable', 'url', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['keywords'] = $validated['keywords'] ?? [];
        $validated['rules'] = $validated['rules'] ?? [];

        $case = ScamCase::create($validated);

        return response()->success($case, '案例建立成功', 201);
    }

    /**
     * 更新指定的防詐案例
     */
    public function update(Request $request, ScamCase $case): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'scam_type' => ['required', 'string', 'max:100'],
            'threat_level' => ['required', 'string', 'in:safe,warning,danger'],
            'keywords' => ['nullable', 'array'],
            'keywords.*' => ['string'],
            'method' => ['nullable', 'string'],
            'rules' => ['nullable', 'array'],
            'rules.*' => ['string'],
            'source_url' => ['nullable', 'url', 'max:2048'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['keywords'] = $validated['keywords'] ?? [];
        $validated['rules'] = $validated['rules'] ?? [];

        $case->update($validated);

        return response()->success($case, '案例更新成功');
    }

    /**
     * 刪除指定的防詐案例
     */
    public function destroy(ScamCase $case): JsonResponse
    {
        $case->delete();

        return response()->success(null, '案例刪除成功');
    }
}
