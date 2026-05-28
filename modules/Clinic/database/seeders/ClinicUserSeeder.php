<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserSeeder extends Seeder
{
    /**
     * Adiciona profissionais extras para desenvolvimento/testes.
     * Não executa em produção.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $extras = [
            [
                'clinic_id' => 2,
                'name'      => 'Dra. Ana Paula Ferreira',
                'email'     => 'ana.paula@fisioelite.com',
                'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
            ],
        ];

        foreach ($extras as $data) {
            $clinic = Clinic::find($data['clinic_id']);

            if (!$clinic) {
                $this->command->warn("Clínica {$data['clinic_id']} não encontrada — pulando {$data['name']}.");

                continue;
            }

            $user = ClinicUser::updateOrCreate(
                ['email' => $data['email']],
                [
                    'clinic_id' => $data['clinic_id'],
                    'name'      => $data['name'],
                    'password'  => Hash::make('password'),
                    'role'      => $data['role'],
                    'status'    => ClinicUser::STATUS_ACTIVE,
                ],
            );

            $action = $user->wasRecentlyCreated ? 'criado' : 'atualizado';
            $this->command->info("Profissional {$action}: {$user->name} (clínica {$clinic->name}).");
        }
    }
}
