<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'start',
                'type_charge' => Plan::TYPE_CHARGE_FIXO,
                'value_month' => 99.00,
                'value_year' => 990.00,
            ],
            [
                'name' => 'perform',
                'type_charge' => Plan::TYPE_CHARGE_FIXO,
                'value_month' => 199.00,
                'value_year' => 1990.00,
            ],
            [
                'name' => 'premium',
                'type_charge' => Plan::TYPE_CHARGE_FIXO,
                'value_month' => 299.00,
                'value_year' => 2990.00,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(
                ['name' => $plan['name']],
                $plan
            );
        }
    }
}
