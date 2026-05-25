<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->string('threat_level')->default('warning')->after('scam_type');
            $table->json('keywords')->nullable()->after('threat_level');
            $table->text('method')->nullable()->after('keywords');
            $table->json('rules')->nullable()->after('method');
        });
    }

    public function down(): void
    {
        Schema::table('scam_cases', function (Blueprint $table) {
            $table->dropColumn(['threat_level', 'keywords', 'method', 'rules']);
        });
    }
};
