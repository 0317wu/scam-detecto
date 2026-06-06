<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScamScan extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'visitor_id',
        'input_type',
        'content',
        'url',
        'image_path',
        'ocr_text',
        'risk_score',
        'risk_level',
        'scam_type',
        'summary',
        'risk_factors',
        'suggestions',
        'ai_raw_response',
        'is_converted_to_case',
    ];

    protected function casts(): array
    {
        return [
            'risk_score' => 'integer',
            'risk_factors' => 'array',
            'suggestions' => 'array',
            'ai_raw_response' => 'array',
            'is_converted_to_case' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
