<?php

namespace Modules\ClinicQuestionnaire\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientQuestionnaireSendEmailTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private ClinicUser $adminA;

    private Patient $patientA;

    private PatientQuestionnaire $questionnaireA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinicA = Clinic::factory()->create();
        $this->adminA  = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $this->patientA = Patient::factory()->forClinic($this->clinicA)->create([
            'email' => 'paciente-a@example.test',
        ]);
        $this->questionnaireA = PatientQuestionnaire::factory()
            ->forPatient($this->patientA, $this->clinicA)
            ->create([
                'clinic_user_id' => $this->adminA->id,
                'modality'       => PatientQuestionnaire::MODALITY_REMOTO,
                'status'         => PatientQuestionnaire::STATUS_PENDING,
                'expires_at'     => now()->addDays(3),
            ]);
    }

    public function test_queues_email_and_dispatches_event_for_pending_questionnaire_with_patient_email(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
            ->assertStatus(202)
            ->assertExactJson(['data' => ['queued' => true]]);

        Event::assertDispatched(QuestionnaireEmailRequested::class, function (QuestionnaireEmailRequested $event): bool {
            return $event->version === 1
                && $event->clinicId === $this->clinicA->id
                && $event->patientQuestionnaireId === $this->questionnaireA->id
                && $event->patientId === $this->patientA->id
                && $event->actorId === $this->adminA->id;
        });
    }

    public function test_physiotherapist_and_secretary_of_own_clinic_can_send_questionnaire_email(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        foreach ([ClinicUser::ROLE_PHYSIOTHERAPIST, ClinicUser::ROLE_SECRETARY] as $role) {
            $user = ClinicUser::factory()->create([
                'clinic_id' => $this->clinicA->id,
                'role'      => $role,
            ]);

            $this->actingAs($user, 'clinic')
                ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
                ->assertStatus(202)
                ->assertExactJson(['data' => ['queued' => true]]);
        }

        Event::assertDispatchedTimes(QuestionnaireEmailRequested::class, 2);
    }

    public function test_returns_404_and_does_not_dispatch_for_another_clinic_or_another_patient(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        $clinicB = Clinic::factory()->create();
        $adminB  = ClinicUser::factory()->create([
            'clinic_id' => $clinicB->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $patientB = Patient::factory()->forClinic($clinicB)->create([
            'email' => 'paciente-b@example.test',
        ]);
        $questionnaireB = PatientQuestionnaire::factory()
            ->forPatient($patientB, $clinicB)
            ->create([
                'status'     => PatientQuestionnaire::STATUS_PENDING,
                'expires_at' => now()->addDays(3),
            ]);
        $otherPatientA = Patient::factory()->forClinic($this->clinicA)->create([
            'email' => 'outro-paciente-a@example.test',
        ]);
        $questionnaireOtherPatient = PatientQuestionnaire::factory()
            ->forPatient($otherPatientA, $this->clinicA)
            ->create([
                'status'     => PatientQuestionnaire::STATUS_PENDING,
                'expires_at' => now()->addDays(3),
            ]);

        $this->actingAs($adminB, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
            ->assertNotFound();

        $this->actingAs($adminB, 'clinic')
            ->postJson("/api/clinic/patients/{$patientB->id}/questionnaires/{$this->questionnaireA->id}/email")
            ->assertNotFound();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$questionnaireB->id}/email")
            ->assertNotFound();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$questionnaireOtherPatient->id}/email")
            ->assertNotFound();

        Event::assertNotDispatched(QuestionnaireEmailRequested::class);
        $this->assertSame(
            PatientQuestionnaire::STATUS_PENDING,
            $this->questionnaireA->fresh()->status,
        );
    }

    public function test_returns_422_for_answered_questionnaire_without_dispatching(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        $answered = PatientQuestionnaire::factory()
            ->forPatient($this->patientA, $this->clinicA)
            ->answered()
            ->create();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$answered->id}/email")
            ->assertStatus(422);

        Event::assertNotDispatched(QuestionnaireEmailRequested::class);
    }

    public function test_returns_422_for_expired_questionnaire_without_dispatching_or_changing_it(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        $expired = PatientQuestionnaire::factory()
            ->forPatient($this->patientA, $this->clinicA)
            ->expired()
            ->create();
        $pastDue = PatientQuestionnaire::factory()
            ->forPatient($this->patientA, $this->clinicA)
            ->create([
                'status'     => PatientQuestionnaire::STATUS_PENDING,
                'expires_at' => now()->subMinute(),
            ]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$expired->id}/email")
            ->assertStatus(422);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$pastDue->id}/email")
            ->assertStatus(422);

        Event::assertNotDispatched(QuestionnaireEmailRequested::class);
        $this->assertSame(PatientQuestionnaire::STATUS_PENDING, $pastDue->fresh()->status);
    }

    public function test_returns_422_when_patient_has_no_email_and_404_when_patient_was_deleted(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        $noEmailPatient = Patient::factory()->forClinic($this->clinicA)->create([
            'email' => '',
        ]);
        $questionnaireNoEmail = PatientQuestionnaire::factory()
            ->forPatient($noEmailPatient, $this->clinicA)
            ->create([
                'status'     => PatientQuestionnaire::STATUS_PENDING,
                'expires_at' => now()->addDays(3),
            ]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$noEmailPatient->id}/questionnaires/{$questionnaireNoEmail->id}/email")
            ->assertStatus(422);

        $deletedPatient = Patient::factory()->forClinic($this->clinicA)->create([
            'email' => 'removido@example.test',
        ]);
        $questionnaireDeleted = PatientQuestionnaire::factory()
            ->forPatient($deletedPatient, $this->clinicA)
            ->create([
                'status'     => PatientQuestionnaire::STATUS_PENDING,
                'expires_at' => now()->addDays(3),
            ]);
        $deletedPatient->delete();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$deletedPatient->id}/questionnaires/{$questionnaireDeleted->id}/email")
            ->assertNotFound();

        Event::assertNotDispatched(QuestionnaireEmailRequested::class);
    }

    public function test_sixth_request_in_same_minute_by_same_user_returns_429_without_blocking_others(): void
    {
        Event::fake([QuestionnaireEmailRequested::class]);

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($this->adminA, 'clinic')
                ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
                ->assertStatus(202);
        }

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
            ->assertStatus(429);

        Event::assertDispatchedTimes(QuestionnaireEmailRequested::class, 5);

        $otherUser = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($otherUser, 'clinic')
            ->postJson("/api/clinic/patients/{$this->patientA->id}/questionnaires/{$this->questionnaireA->id}/email")
            ->assertStatus(202);
    }
}
