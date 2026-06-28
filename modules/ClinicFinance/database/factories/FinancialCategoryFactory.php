<?php

namespace Modules\ClinicFinance\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\ClinicFinance\Enums\FinancialCategoryOrigin;
use Modules\ClinicFinance\Enums\FinancialTransactionType;
use Modules\ClinicFinance\Models\FinancialCategory;

/**
 * @extends Factory<FinancialCategory>
 */
class FinancialCategoryFactory extends Factory
{
    protected $model = FinancialCategory::class;

    public function definition(): array
    {
        return [
            'clinic_id'     => null,
            'name'          => fake()->words(2, true),
            'type'          => FinancialTransactionType::Entrada,
            'origin'        => FinancialCategoryOrigin::System,
            'active'        => true,
            'display_order' => fake()->numberBetween(0, 100),
        ];
    }

    public function custom(Clinic $clinic): static
    {
        return $this->state(fn () => [
            'clinic_id' => $clinic->id,
            'origin'    => FinancialCategoryOrigin::Custom,
        ]);
    }

    public function type(FinancialTransactionType $type): static
    {
        return $this->state(fn () => ['type' => $type]);
    }
}
