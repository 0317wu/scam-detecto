<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scam_cases', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->string('scam_type')->nullable();
            $table->text('source_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'created_at']);
            $table->index('scam_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scam_cases');
    }
};
