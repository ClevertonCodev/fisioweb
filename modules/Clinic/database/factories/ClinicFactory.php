<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;

/**
 * @extends Factory<Clinic>
 */
class ClinicFactory extends Factory
{
    protected $model = Clinic::class;

    public function definition(): array
    {
        return [
            'name'        => fake()->company(),
            'email'       => fake()->unique()->companyEmail(),
            'type_person' => Clinic::TYPE_PERSON_JURIDICA,
            'status'      => Clinic::STATUS_ACTIVE,
        ];
    }
}
