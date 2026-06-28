<?php

namespace Modules\ClinicFinance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;

/**
 * @extends Factory<PeriodOpeningBalance>
 */
class PeriodOpeningBalanceFactory extends Factory
{
    protected $model = PeriodOpeningBalance::class;

    public function definition(): array
    {
        return [
            'clinic_id'           => Clinic::factory(),
            'year'                => (int) now()->format('Y'),
            'month'               => (int) now()->format('n'),
            'amount'              => fake()->randomFloat(2, 0, 5000),
            'updated_by_user_id'  => ClinicUser::factory(),
        ];
    }
}
