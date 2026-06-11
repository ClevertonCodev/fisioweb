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
        $cpf       = fake()->numerify('###########');
        $firstName = fake()->firstName();

        return [
            'clinic_id'         => Clinic::factory(),
            'name'              => fake()->name(),
            'email'             => fake()->unique()->safeEmail(),
            'password'          => $cpf, // CPF é a senha padrão
            'cpf'               => $cpf,
            'phone'             => fake()->numerify('##9########'),
            'birth_date'        => fake()->date('Y-m-d', '-18 years'),
            'gender'            => fake()->randomElement(['masculino', 'feminino']),
            'biological_sex'    => fake()->randomElement(['masculino', 'feminino']),
            'marital_status'    => fake()->randomElement(['solteiro', 'casado', 'divorciado', 'viuvo']),
            'education'         => fake()->randomElement(['fundamental', 'medio', 'superior', 'pos_graduacao']),
            'profession'        => fake()->jobTitle(),
            'emergency_contact' => fake()->numerify('##9########'),
            'caregiver_contact' => fake()->numerify('##9########'),
            'insurance'         => fake()->randomElement(['Unimed', 'Bradesco Saúde', 'Amil', 'SulAmérica', 'Particular']),
            'insurance_number'  => fake()->numerify('##########'),
            'address'           => fake()->streetName() . ', ' . fake()->buildingNumber(),
            'neighborhood'      => fake()->randomElement(['Centro', 'Jardim das Flores', 'Boa Vista', 'São José', 'Alto da Serra']),
            'city'              => fake()->city(),
            'state'             => fake()->randomElement(['SP', 'RJ', 'MG', 'BA', 'PE', 'CE', 'RS']),
            'zip_code'          => fake()->numerify('#####-###'),
            'referral_source'   => fake()->randomElement(['indicacao_medica', 'indicacao_amigo', 'redes_sociais', 'google', 'convenio']),
            'apelido'           => $firstName,
            'is_active'         => true,
            'status'            => 'em_tratamento',
            'diagnosis'         => fake()->randomElement([
                'Lombalgia crônica',
                'Tendinopatia do supraespinhal',
                'Pós-operatório de LCA',
                'Cervicalgia mecânica',
                'Hérnia de disco L4-L5',
                'Síndrome do impacto do ombro',
                'Entorse de tornozelo grau II',
                'Osteoartrose de joelho',
            ]),
            'is_foreign'        => false,
            'use_apelido'       => fake()->boolean(20),
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
