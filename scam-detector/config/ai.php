<?php

return [
    'enabled' => env('AI_ANALYSIS_ENABLED', false),
    'provider' => env('AI_PROVIDER', 'openai'),
    'timeout' => (int) env('AI_TIMEOUT', 30),

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'base_url' => rtrim(env('OPENAI_BASE_URL', 'https://api.openai.com/v1'), '/'),
        'model' => env('OPENAI_MODEL', 'gpt-4.1-mini'),
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'base_url' => rtrim(env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta'), '/'),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
    ],
];
