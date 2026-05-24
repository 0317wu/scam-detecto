<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScamCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'scam_type',
        'source_url',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}
