<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
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

        $clinic = Clinic::where('email', 'clevertonsantoscodev@gmail.com')->first();

        if (!$clinic) {
            $this->command->warn('Clínica Cleverton não encontrada — pulando usuários extras.');

            return;
        }

        $devPassword = '12345678';

        $extras = [
            [
                'name'   => 'Dra. Ana Paula Ferreira',
                'email'  => 'ana.paula@fisioelite.com',
                'role'   => ClinicUser::ROLE_PHYSIOTHERAPIST,
                'mestre' => ClinicUser::MESTRE_NO,
            ],
            [
                'name'   => 'Carlos Administrador',
                'email'  => 'carlos.admin@fisioelite.com',
                'role'   => ClinicUser::ROLE_ADMIN,
                'mestre' => ClinicUser::MESTRE_NO,
            ],
            [
                'name'   => 'Mariana Secretária',
                'email'  => 'mariana.secretaria@fisioelite.com',
                'role'   => ClinicUser::ROLE_SECRETARY,
                'mestre' => ClinicUser::MESTRE_NO,
            ],
        ];

        foreach ($extras as $data) {
            $user = ClinicUser::updateOrCreate(
                ['email' => $data['email']],
                [
                    'clinic_id' => $clinic->id,
                    'name'      => $data['name'],
                    'password'  => $devPassword,
                    'document'  => '12345678901',
                    'role'      => $data['role'],
                    'mestre'    => $data['mestre'],
                    'status'    => ClinicUser::STATUS_ACTIVE,
                ],
            );

            $action = $user->wasRecentlyCreated ? 'criado' : 'atualizado';
            $this->command->info("Usuário {$action}: {$user->name} ({$user->email}) — senha: {$devPassword}");
        }
    }
}
