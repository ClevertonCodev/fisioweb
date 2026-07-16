<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Database\Seeders\AdminProgramSeeder;
use Modules\Admin\Database\Seeders\AssessmentTemplatesSeeder;
use Modules\Admin\Database\Seeders\BodyRegionSeeder;
use Modules\Admin\Database\Seeders\ExerciseSeeder;
use Modules\Admin\Database\Seeders\PhysioAreaSeeder;
use Modules\Admin\Database\Seeders\PhysioSubareaSeeder;
use Modules\Admin\Database\Seeders\PlanFeatureSeeder;
use Modules\Admin\Models\Plan;
use Modules\Admin\Models\User;
use Modules\Clinic\Database\Seeders\ClinicDatabaseSeeder;
use Modules\Clinic\Database\Seeders\ClinicUserSeeder;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Database\Seeders\MediaDatabaseSeeder;
use Modules\Patient\Database\Seeders\PatientDatabaseSeeder;
use Modules\Patient\Models\Patient;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'cleverton94fla@gmail.com'],
            [
                'name'     => 'Cleverton',
                'password' => '12345678',
            ]
        );

        $this->call(PlanFeatureSeeder::class);

        $plans = Plan::pluck('id', 'name');

        // Uma clínica de demonstração por plano; a Cleverton (existente) é a Premium.
        $clinic = Clinic::updateOrCreate(
            ['email' => 'clevertonsantoscodev@gmail.com'],
            [
                'name'     => 'Clínica Cleverton',
                'document' => '85628325023',
                'slug'     => 'clinica-cleverton',
                'plan_id'  => $plans['Premium'],
            ]
        );

        ClinicUser::updateOrCreate(
            ['email' => 'clevertonsantoscodev@gmail.com'],
            [
                'clinic_id' => $clinic->id,
                'name'      => 'Cleverton',
                'password'  => '12345678',
                'document'  => '85628325023',
                'role'      => ClinicUser::ROLE_ADMIN,
                'mestre'    => ClinicUser::MESTRE_YES,
                'status'    => ClinicUser::STATUS_ACTIVE,
            ]
        );

        Patient::updateOrCreate(
            [
                'email'     => 'cleverton@gmail.com',
                'clinic_id' => $clinic->id,
            ],
            [
                'name'     => 'Cleverton Paciente',
                'password' => '12345678',
            ]
        );

        $extraClinics = [
            [
                'name'     => 'Clínica Start',
                'email'    => 'start@fisioweb.local',
                'document' => '72686859040',
                'slug'     => 'clinica-start',
                'plan'     => 'Start',
                'admin'    => 'Admin Start',
            ],
            [
                'name'     => 'Clínica Performance',
                'email'    => 'performance@fisioweb.local',
                'document' => '74760866000137',
                'slug'     => 'clinica-performance',
                'plan'     => 'Performance',
                'admin'    => 'Admin Performance',
            ],
        ];

        foreach ($extraClinics as $data) {
            $extraClinic = Clinic::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['name'],
                    'document' => $data['document'],
                    'slug'     => $data['slug'],
                    'plan_id'  => $plans[$data['plan']],
                ]
            );

            ClinicUser::updateOrCreate(
                ['email' => $data['email']],
                [
                    'clinic_id' => $extraClinic->id,
                    'name'      => $data['admin'],
                    'password'  => '12345678',
                    'document'  => $data['document'],
                    'role'      => ClinicUser::ROLE_ADMIN,
                    'mestre'    => ClinicUser::MESTRE_YES,
                    'status'    => ClinicUser::STATUS_ACTIVE,
                ]
            );
        }

        // Plano Start: apenas 1 paciente básico (sem massa de demonstração)
        $startClinic = Clinic::where('email', 'start@fisioweb.local')->first();
        Patient::updateOrCreate(
            [
                'email'     => 'paciente.start@fisioweb.local',
                'clinic_id' => $startClinic->id,
            ],
            [
                'name'     => 'Paciente Start',
                'password' => '12345678',
            ]
        );

        $this->call([
            PhysioAreaSeeder::class,
            PhysioSubareaSeeder::class,
            BodyRegionSeeder::class,
            AssessmentTemplatesSeeder::class,
            MediaDatabaseSeeder::class, // vídeos antes dos exercícios (ids 1 e 2)
            ExerciseSeeder::class,
            AdminProgramSeeder::class,
            ClinicUserSeeder::class, // fisios antes dos pacientes ("criado por")
            PatientDatabaseSeeder::class,
            ClinicDatabaseSeeder::class,
        ]);
    }
}
