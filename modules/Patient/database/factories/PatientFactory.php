<?php

namespace Modules\Patient\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;

class PatientFactory extends Factory
{
    protected $model = Patient::class;

    public function definition(): array
    {
        $cpf = fake()->numerify('###########');

        return [
            'clinic_id'   => Clinic::factory(),
            'name'        => fake()->name(),
            'email'       => fake()->unique()->safeEmail(),
            'password'    => $cpf, // CPF é a senha padrão
            'cpf'         => $cpf,
            'phone'       => fake()->numerify('##########'),
            'birth_date'  => fake()->date('Y-m-d', '-18 years'),
            'is_active'   => true,
            'status'      => 'em_tratamento',
            'is_foreign'  => false,
            'use_apelido' => false,
        ];
    }

    public function foreign(): static
    {
        return $this->state(function () {
            $doc = fake()->numerify('########');

            return [
                'is_foreign' => true,
                'cpf'        => $doc,
                'password'   => $doc,
            ];
        });
    }

    public function forClinic(Clinic $clinic): static
    {
        return $this->state(['clinic_id' => $clinic->id]);
    }
}
