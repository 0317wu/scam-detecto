<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class SystemConfigController extends Controller
{
    public function index()
    {
        $provider = config('ai.provider');
        $hasKey = match ($provider) {
            'gemini' => ! empty(config('ai.gemini.api_key')),
            default => ! empty(config('ai.openai.api_key')),
        };

        return response()->json([
            'has_ai_key' => $hasKey,
            'provider' => ucfirst($provider),
        ]);
    }
}
