<?php

namespace Modules\Patient\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

class PatientDatabaseSeeder extends Seeder
{
    /** Foto real hospedada no bucket R2 (fisioweb/patients/photos). */
    private const PHOTO = 'patients/photos/2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png';

    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $cdn = rtrim(config('cloudflare.cdn_url', 'https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev'), '/');

        // Massa de pacientes só para Performance e Premium; a clínica Start fica mínima
        $clinics = Clinic::whereIn('email', ['clevertonsantoscodev@gmail.com', 'performance@fisioweb.local'])->get();
        foreach ($clinics as $clinic) {
            $this->seedForClinic($clinic, $cdn);
        }

        // Todos os pacientes seedados (inclusive fora da factory, ex.: DatabaseSeeder) usam a foto do R2
        Patient::query()->update(['photo_url' => $cdn . '/' . self::PHOTO]);
    }

    private function seedForClinic(Clinic $clinic, string $cdn): void
    {
        // Fisioterapeutas da clínica para preencher "criado por"
        $physios = ClinicUser::where('clinic_id', $clinic->id)
            ->where('role', ClinicUser::ROLE_PHYSIOTHERAPIST)
            ->get();

        if ($physios->isEmpty()) {
            $physios = ClinicUser::where('clinic_id', $clinic->id)->get();
        }

        // Idempotência: não recria a massa se a clínica já foi populada
        $existing = Patient::where('clinic_id', $clinic->id)->count();

        $patients = $existing >= 50
            ? collect()
            : Patient::factory()
                ->count(50 - $existing)
                ->forClinic($clinic)
                ->create();

        foreach ($patients as $index => $patient) {
            $patient->update([
                'photo_url'      => $cdn . '/' . self::PHOTO,
                'clinic_user_id' => $physios->isNotEmpty() ? $physios[$index % $physios->count()]->id : null,
            ]);
        }

        // Garante fisio também nos pacientes criados fora da factory (ex.: DatabaseSeeder)
        Patient::where('clinic_id', $clinic->id)
            ->whereNull('clinic_user_id')
            ->get()
            ->each(fn (Patient $patient) => $patient->update([
                'clinic_user_id' => $physios->first()?->id,
            ]));

        $this->command->info("Clínica {$clinic->id}: " . Patient::where('clinic_id', $clinic->id)->count() . ' pacientes com foto e fisioterapeuta.');
    }
}
