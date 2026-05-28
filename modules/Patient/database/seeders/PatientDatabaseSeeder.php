<?php

namespace Modules\Patient\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Models\Clinic;
use Modules\Patient\Models\Patient;

class PatientDatabaseSeeder extends Seeder
{
    private const PHOTO_URL = 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev/patients/photos/032810b7-4ba1-4d74-9243-1005b4460b69_1774066597.jpeg';

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $clinics = Clinic::query()->orderBy('id')->limit(2)->get();
        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic);
        }
    }

    private function seedForClinic(Clinic $clinic): void
    {
        // 35 pacientes com foto
        Patient::factory()
            ->count(35)
            ->forClinic($clinic)
            ->create(['photo_url' => self::PHOTO_URL]);

        // 15 pacientes sem foto
        Patient::factory()
            ->count(15)
            ->forClinic($clinic)
            ->create();
    }
}
