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
        // 於 users 資料表新增 is_admin 欄位
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin')->default(false)->after('password');
        });

        // 於 scam_scans 資料表新增 visitor_id 欄位並建立索引
        Schema::table('scam_scans', function (Blueprint $table) {
            $table->string('visitor_id', 36)->nullable()->after('user_id');
            $table->index('visitor_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_admin');
        });

        Schema::table('scam_scans', function (Blueprint $table) {
            $table->dropIndex(['visitor_id']);
            $table->dropColumn('visitor_id');
        });
    }
};
