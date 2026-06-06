<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Admin\Database\Seeders\BodyRegionSeeder;
use Modules\Admin\Database\Seeders\PhysioAreaSeeder;
use Modules\Admin\Database\Seeders\PhysioSubareaSeeder;
use Modules\Admin\Models\User;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\Admin\Database\Seeders\AssessmentTemplatesSeeder;
use Modules\Admin\Database\Seeders\ExerciseSeeder;
use Modules\Patient\Database\Seeders\PatientDatabaseSeeder;
use Modules\Clinic\Database\Seeders\ClinicDatabaseSeeder;

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

        $clinic = Clinic::updateOrCreate(
            ['email' => 'clevertonsantoscodev@gmail.com'],
            [
                'name'     => 'Clínica Cleverton',
                'document' => '00000000000',
            ]
        );

        ClinicUser::updateOrCreate(
            ['email' => 'clevertonsantoscodev@gmail.com'],
            [
                'clinic_id' => $clinic->id,
                'name'      => 'Cleverton',
                'password'  => '12345678',
                'document'  => '00000000000',
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

        $this->call([
            PhysioAreaSeeder::class,
            PhysioSubareaSeeder::class,
            BodyRegionSeeder::class,
            AssessmentTemplatesSeeder::class,
            ExerciseSeeder::class,
            PatientDatabaseSeeder::class,
            ClinicDatabaseSeeder::class,
        ]);
    }
}
