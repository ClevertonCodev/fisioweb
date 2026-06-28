<?php

namespace Modules\ClinicQuestionnaire\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;

/**
 * @extends Factory<PatientQuestionnaire>
 */
class PatientQuestionnaireFactory extends Factory
{
    protected $model = PatientQuestionnaire::class;

    public function definition(): array
    {
        $clinic = Clinic::factory()->create();

        return [
            'clinic_id'                 => $clinic->id,
            'patient_id'                => Patient::factory()->forClinic($clinic),
            'clinic_user_id'            => ClinicUser::factory()->state(['clinic_id' => $clinic->id]),
            'questionnaire_template_id' => QuestionnaireTemplate::factory()->forClinic($clinic),
            'status'                    => PatientQuestionnaire::STATUS_PENDING,
            'modality'                  => PatientQuestionnaire::MODALITY_PRESENCIAL,
            'answered_at'               => null,
            'expires_at'                => null,
        ];
    }

    public function forPatient(Patient $patient, Clinic $clinic): static
    {
        return $this->state([
            'clinic_id'                 => $clinic->id,
            'patient_id'                => $patient->id,
            'questionnaire_template_id' => QuestionnaireTemplate::factory()->forClinic($clinic),
        ]);
    }

    public function answered(): static
    {
        return $this->state([
            'status'      => PatientQuestionnaire::STATUS_ANSWERED,
            'answered_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state([
            'status'     => PatientQuestionnaire::STATUS_EXPIRED,
            'expires_at' => now()->subDay(),
        ]);
    }
}
