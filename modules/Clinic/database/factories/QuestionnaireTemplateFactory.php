<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\QuestionnaireTemplate;

/**
 * @extends Factory<QuestionnaireTemplate>
 */
class QuestionnaireTemplateFactory extends Factory
{
    protected $model = QuestionnaireTemplate::class;

    public function definition(): array
    {
        return [
            'clinic_id'   => Clinic::factory(),
            'title'       => fake()->sentence(4),
            'description' => fake()->sentence(),
            'is_active'   => true,
        ];
    }

    public function forClinic(Clinic $clinic): static
    {
        return $this->state(['clinic_id' => $clinic->id]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
