<?php

namespace Modules\Clinic\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;

class ClinicUserSeeder extends Seeder
{
    private const PHOTO_BASE = 'patients/photos/';

    /** Fotos reais hospedadas no bucket R2 (fisioweb/patients/photos), reaproveitadas do seeder de pacientes. */
    private const PHOTOS = [
        '032810b7-4ba1-4d74-9243-1005b4460b69_1774066597.jpeg',
        '6e70de13-4eeb-4afb-8f35-89d1247a361f_1780851118.jpeg',
        '8adf7633-4538-40b7-b1b8-559e53abca4e_1774075098.jpeg',
        'a001990a-79dd-4edd-80cd-ed5940c1271a_1776215136.jpeg',
        'b2f0bc67-6252-47e6-8c99-ead5661130aa_1774074879.jpeg',
        'd216b1fa-985c-4952-9290-a383f601e213_1774074338.jpeg',
    ];

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

        foreach ($extras as $index => $data) {
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
                    'photo_url' => $cdn . '/' . self::PHOTO_BASE . self::PHOTOS[$index % count(self::PHOTOS)],
                ],
            );

            $action = $user->wasRecentlyCreated ? 'criado' : 'atualizado';
            $this->command->info("Usuário {$action}: {$user->name} ({$user->email}) — senha: {$devPassword}");
        }

        // Garante foto também nos usuários criados fora deste seeder (ex.: usuário mestre),
        // deslocando o índice para não repetir as fotos já usadas nos extras
        $offset = count($extras);

        ClinicUser::whereNull('photo_url')
            ->get()
            ->each(fn (ClinicUser $user, int $index) => $user->update([
                'photo_url' => $cdn . '/' . self::PHOTO_BASE . self::PHOTOS[($index + $offset) % count(self::PHOTOS)],
            ]));
    }
}
