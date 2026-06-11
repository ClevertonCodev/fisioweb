<?php

namespace Modules\Patient\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

class PatientDatabaseSeeder extends Seeder
{
    private const PHOTO_BASE = 'patients/photos/';

    /** Fotos reais hospedadas no bucket R2 (fisioweb/patients/photos). */
    private const PHOTOS = [
        '032810b7-4ba1-4d74-9243-1005b4460b69_1774066597.jpeg',
        '6e70de13-4eeb-4afb-8f35-89d1247a361f_1780851118.jpeg',
        '8adf7633-4538-40b7-b1b8-559e53abca4e_1774075098.jpeg',
        'a001990a-79dd-4edd-80cd-ed5940c1271a_1776215136.jpeg',
        'b2f0bc67-6252-47e6-8c99-ead5661130aa_1774074879.jpeg',
        'd216b1fa-985c-4952-9290-a383f601e213_1774074338.jpeg',
    ];

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
        $cdn = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

        // Fisioterapeutas da clínica para preencher "criado por"
        $physios = ClinicUser::where('clinic_id', $clinic->id)
            ->where('role', ClinicUser::ROLE_PHYSIOTHERAPIST)
            ->get();

        if ($physios->isEmpty()) {
            $physios = ClinicUser::where('clinic_id', $clinic->id)->get();
        }

        $patients = Patient::factory()
            ->count(50)
            ->forClinic($clinic)
            ->create();

        foreach ($patients as $index => $patient) {
            $patient->update([
                'photo_url'      => $cdn . '/' . self::PHOTO_BASE . self::PHOTOS[$index % count(self::PHOTOS)],
                'clinic_user_id' => $physios->isNotEmpty() ? $physios[$index % $physios->count()]->id : null,
            ]);
        }

        // Garante foto e fisio também nos pacientes criados fora da factory (ex.: DatabaseSeeder)
        Patient::where('clinic_id', $clinic->id)
            ->whereNull('photo_url')
            ->get()
            ->each(fn (Patient $patient, int $index) => $patient->update([
                'photo_url'      => $cdn . '/' . self::PHOTO_BASE . self::PHOTOS[$index % count(self::PHOTOS)],
                'clinic_user_id' => $patient->clinic_user_id ?? $physios->first()?->id,
            ]));

        $this->command->info("Clínica {$clinic->id}: " . Patient::where('clinic_id', $clinic->id)->count() . ' pacientes com foto e fisioterapeuta.');
    }
}
