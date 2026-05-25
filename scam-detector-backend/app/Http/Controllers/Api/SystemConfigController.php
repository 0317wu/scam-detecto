<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;

class SystemConfigController extends Controller
{
    public function index()
    {
        return response()->json([
            'has_ai_key' => !empty(config('services.openai.api_key')),
        ]);
    }
}
