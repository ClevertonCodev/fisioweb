<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserSeeder extends Seeder
{
    /** Foto real hospedada no bucket R2 (fisioweb/patients/photos), reaproveitada do seeder de pacientes. */
    private const PHOTO = 'patients/photos/2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png';

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
        $cdn         = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

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
                    'photo_url' => $cdn . '/' . self::PHOTO,
                ],
            );

            $action = $user->wasRecentlyCreated ? 'criado' : 'atualizado';
            $this->command->info("Usuário {$action}: {$user->name} ({$user->email}) — senha: {$devPassword}");
        }

        // Garante a foto do R2 também nos usuários criados fora deste seeder (ex.: admins do DatabaseSeeder)
        ClinicUser::query()->update(['photo_url' => $cdn . '/' . self::PHOTO]);
    }
}
