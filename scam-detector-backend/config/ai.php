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
];
