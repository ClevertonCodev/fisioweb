<?php

namespace Modules\Clinic\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientFile;
use Modules\Patient\Models\Patient;

/**
 * @extends Factory<PatientFile>
 */
class PatientFileFactory extends Factory
{
    protected $model = PatientFile::class;

    public function definition(): array
    {
        $clinic = Clinic::factory()->create();

        return [
            'clinic_id'      => $clinic->id,
            'patient_id'     => Patient::factory()->forClinic($clinic),
            'clinic_user_id' => ClinicUser::factory()->state(['clinic_id' => $clinic->id]),
            'original_name'  => fake()->word() . '.pdf',
            'file_path'      => 'patients/files/' . fake()->uuid() . '.pdf',
            'cdn_url'        => 'https://cdn.example.com/patients/files/' . fake()->uuid() . '.pdf',
            'mime_type'      => 'application/pdf',
            'size'           => fake()->numberBetween(1024, 1048576),
        ];
    }

    public function forPatient(Patient $patient, Clinic $clinic): static
    {
        return $this->state([
            'clinic_id'  => $clinic->id,
            'patient_id' => $patient->id,
        ]);
    }
}
