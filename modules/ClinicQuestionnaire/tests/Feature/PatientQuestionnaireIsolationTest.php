<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientQuestionnaireIsolationTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private ClinicUser $physioA;

    private Patient $patientA;

    private QuestionnaireTemplate $templateA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA = Clinic::factory()->create();
        ClinicUser::factory()->count(3)->create(['clinic_id' => $this->clinicA->id]);
        $this->physioA = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        // Pré-condição: id do usuário ≠ id da clínica, para que trocar um pelo outro seja detectável.
        $this->assertNotSame($this->clinicA->id, $this->physioA->id);

        $this->patientA  = Patient::factory()->forClinic($this->clinicA)->create();
        $this->templateA = QuestionnaireTemplate::factory()->forClinic($this->clinicA)->create();
    }

    public function test_store_records_authenticated_user_as_sender(): void
    {
        $id = $this->actingAs($this->physioA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires", [
                'questionnaire_template_id' => $this->templateA->id,
                'modality'                  => 'remoto',
                'expires_at'                => now()->addDays(7)->toDateTimeString(),
            ])
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('clinic_patient_questionnaires', [
            'id'             => $id,
            'clinic_id'      => $this->clinicA->id,
            'clinic_user_id' => $this->physioA->id,
        ]);
    }

    public function test_show_returns_questionnaire_of_own_clinic_patient(): void
    {
        $questionnaire = PatientQuestionnaire::factory()->forPatient($this->patientA, $this->clinicA)->create();

        $this->actingAs($this->physioA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$questionnaire->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $questionnaire->id);
    }

    public function test_cannot_show_questionnaire_of_another_clinic(): void
    {
        $questionnaire = PatientQuestionnaire::factory()->forPatient($this->patientA, $this->clinicA)->create();
        $otherUser     = ClinicUser::factory()->create();

        $this->actingAs($otherUser, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$questionnaire->id}")
            ->assertNotFound();
    }
}
