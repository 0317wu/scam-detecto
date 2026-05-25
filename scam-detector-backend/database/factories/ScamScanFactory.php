<?php

namespace Database\Factories;

use App\Models\ScamScan;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScamScan>
 */
class ScamScanFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => \App\Models\User::factory(),
            'input_type' => 'text',
            'content' => fake()->paragraph(),
            'risk_score' => fake()->numberBetween(0, 100),
            'risk_level' => fake()->randomElement(['safe', 'warning', 'danger']),
            'scam_type' => 'none',
        ];
    }
}
