<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('scam_scans', function (Blueprint $table) {
            $table->boolean('is_converted_to_case')->default(false)->after('ai_raw_response');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scam_scans', function (Blueprint $table) {
            $table->dropColumn('is_converted_to_case');
        });
    }
};
