<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class ScamCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'scam_type',
        'threat_level',
        'keywords',
        'method',
        'rules',
        'source_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'keywords' => 'array',
            'rules' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::saved(function ($case) {
            Cache::forget('dynamic_scam_rules');
        });

        static::deleted(function ($case) {
            Cache::forget('dynamic_scam_rules');
        });
    }
}
