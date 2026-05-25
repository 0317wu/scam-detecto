<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 建立預設管理員帳號
        \App\Models\User::updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin Operator',
                'password' => bcrypt('password'),
                'is_admin' => true,
            ]
        );

        $this->call([
            ScamCaseSeeder::class,
        ]);
    }
}
