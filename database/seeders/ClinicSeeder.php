<?php

namespace Database\Seeders;

use App\Models\Clinic;
use App\Models\Plan;
use Illuminate\Database\Seeder;

class ClinicSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = Plan::all();

        if ($plans->isEmpty()) {
            $this->command->warn('Nenhum plano encontrado. Execute o PlanSeeder primeiro.');

            return;
        }

        $clinics = [
            [
                'name' => 'Clínica Fisio Saúde',
                'document' => '12.345.678/0001-90',
                'type_person' => Clinic::TYPE_PERSON_JURIDICA,
                'status' => Clinic::STATUS_ACTIVE,
                'email' => 'contato@fisiosaude.com.br',
                'phone' => '(11) 3456-7890',
                'url' => 'https://fisiosaude.com.br',
                'address' => 'Rua das Flores, 123',
                'city' => 'São Paulo',
                'state' => 'SP',
                'zip_code' => '01234-567',
                'plan_id' => $plans->where('name', 'premium')->first()?->id,
            ],
            [
                'name' => 'Fisioterapia & Bem Estar',
                'document' => '98.765.432/0001-10',
                'type_person' => Clinic::TYPE_PERSON_JURIDICA,
                'status' => Clinic::STATUS_ACTIVE,
                'email' => 'contato@fisioebemestar.com.br',
                'phone' => '(21) 9876-5432',
                'url' => 'https://fisioebemestar.com.br',
                'address' => 'Avenida Atlântica, 456',
                'city' => 'Rio de Janeiro',
                'state' => 'RJ',
                'zip_code' => '22010-000',
                'plan_id' => $plans->where('name', 'perform')->first()?->id,
            ],
            [
                'name' => 'Centro de Reabilitação Movimento',
                'document' => '11.222.333/0001-44',
                'type_person' => Clinic::TYPE_PERSON_JURIDICA,
                'status' => Clinic::STATUS_ACTIVE,
                'email' => 'contato@movimentofisio.com.br',
                'phone' => '(31) 3333-4444',
                'url' => null,
                'address' => 'Rua da Liberdade, 789',
                'city' => 'Belo Horizonte',
                'state' => 'MG',
                'zip_code' => '30140-000',
                'plan_id' => $plans->where('name', 'start')->first()?->id,
            ],
            [
                'name' => 'Fisio Premium Clínica',
                'document' => '55.666.777/0001-88',
                'type_person' => Clinic::TYPE_PERSON_JURIDICA,
                'status' => Clinic::STATUS_INACTIVE,
                'email' => 'contato@fisiopremium.com.br',
                'phone' => '(41) 5555-6666',
                'url' => 'https://fisiopremium.com.br',
                'address' => 'Avenida Sete de Setembro, 321',
                'city' => 'Curitiba',
                'state' => 'PR',
                'zip_code' => '80060-000',
                'plan_id' => $plans->where('name', 'premium')->first()?->id,
            ],
            [
                'name' => 'Clínica Vida Ativa',
                'document' => '99.888.777/0001-66',
                'type_person' => Clinic::TYPE_PERSON_JURIDICA,
                'status' => Clinic::STATUS_CANCELLED,
                'email' => 'contato@vidaativa.com.br',
                'phone' => '(51) 7777-8888',
                'url' => null,
                'address' => 'Rua dos Andradas, 654',
                'city' => 'Porto Alegre',
                'state' => 'RS',
                'zip_code' => '90020-000',
                'plan_id' => $plans->where('name', 'perform')->first()?->id,
            ],
        ];

        foreach ($clinics as $clinic) {
            Clinic::updateOrCreate(
                ['document' => $clinic['document']],
                $clinic
            );
        }

        $this->command->info('5 clínicas criadas com sucesso!');
    }
}
