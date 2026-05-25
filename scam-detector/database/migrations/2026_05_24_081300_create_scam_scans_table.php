<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scam_scans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('input_type', 20);
            $table->text('content')->nullable();
            $table->text('url')->nullable();
            $table->string('image_path')->nullable();
            $table->text('ocr_text')->nullable();
            $table->unsignedTinyInteger('risk_score')->default(0);
            $table->string('risk_level', 20)->default('safe');
            $table->string('scam_type')->nullable();
            $table->text('summary')->nullable();
            $table->json('risk_factors')->nullable();
            $table->json('suggestions')->nullable();
            $table->json('ai_raw_response')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['input_type', 'risk_level']);
            $table->index('scam_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scam_scans');
    }
};
