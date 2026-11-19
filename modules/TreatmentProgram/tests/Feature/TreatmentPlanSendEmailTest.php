<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Tests\TestCase;

class TreatmentPlanSendEmailTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private Patient $patientA;

    private TreatmentPlan $planA;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA = Clinic::factory()->create(['slug' => 'clinica-a']);
        $clinicB = Clinic::factory()->create(['slug' => 'clinica-b']);

        $this->adminA = ClinicUser::factory()->create([
            'clinic_id' => $clinicA->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $this->adminB = ClinicUser::factory()->create([
            'clinic_id' => $clinicB->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);

        $this->patientA = Patient::factory()->create([
            'clinic_id' => $clinicA->id,
            'email'     => 'paciente-a@example.test',
        ]);

        $this->planA = TreatmentPlan::create([
            'clinic_id'      => $clinicA->id,
            'clinic_user_id' => $this->adminA->id,
            'patient_id'     => $this->patientA->id,
            'title'          => 'Fortalecimento de joelho',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);
    }

    public function test_queues_email_and_dispatches_event_for_active_plan_with_patient_email(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
            ->assertStatus(202)
            ->assertExactJson(['data' => ['queued' => true]]);

        Event::assertDispatched(TreatmentPlanEmailRequested::class, function (TreatmentPlanEmailRequested $event): bool {
            return $event->version === 1
                && $event->clinicId === $this->adminA->clinic_id
                && $event->treatmentPlanId === $this->planA->id
                && $event->patientId === $this->patientA->id
                && $event->actorId === $this->adminA->id;
        });
    }

    public function test_physiotherapist_and_secretary_of_own_clinic_can_send_program_email(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        foreach ([ClinicUser::ROLE_PHYSIOTHERAPIST, ClinicUser::ROLE_SECRETARY] as $role) {
            $user = ClinicUser::factory()->create([
                'clinic_id' => $this->adminA->clinic_id,
                'role'      => $role,
            ]);

            $this->actingAs($user, 'clinic')
                ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
                ->assertStatus(202)
                ->assertExactJson(['data' => ['queued' => true]]);
        }

        Event::assertDispatchedTimes(TreatmentPlanEmailRequested::class, 2);
    }

    public function test_returns_404_and_does_not_dispatch_for_plan_of_another_clinic(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
            ->assertNotFound();

        Event::assertNotDispatched(TreatmentPlanEmailRequested::class);
    }

    public function test_returns_422_for_draft_plan_without_dispatching(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        $draft = TreatmentPlan::create([
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
            'patient_id'     => $this->patientA->id,
            'title'          => 'Rascunho',
            'status'         => TreatmentPlan::STATUS_DRAFT,
        ]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$draft->id}/email")
            ->assertStatus(422);

        Event::assertNotDispatched(TreatmentPlanEmailRequested::class);
    }

    public function test_returns_422_for_plan_without_patient_without_dispatching(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        $model = TreatmentPlan::create([
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
            'patient_id'     => null,
            'title'          => 'Sem paciente',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$model->id}/email")
            ->assertStatus(422);

        Event::assertNotDispatched(TreatmentPlanEmailRequested::class);
    }

    public function test_returns_422_when_patient_has_no_email_or_was_deleted(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        $noEmailPatient = Patient::factory()->create([
            'clinic_id' => $this->adminA->clinic_id,
            'email'     => '',
        ]);
        $planNoEmail = TreatmentPlan::create([
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
            'patient_id'     => $noEmailPatient->id,
            'title'          => 'Sem e-mail',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$planNoEmail->id}/email")
            ->assertStatus(422);

        $deletedPatient = Patient::factory()->create([
            'clinic_id' => $this->adminA->clinic_id,
            'email'     => 'removido@example.test',
        ]);
        $planDeletedPatient = TreatmentPlan::create([
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
            'patient_id'     => $deletedPatient->id,
            'title'          => 'Paciente removido',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);
        $deletedPatient->delete();

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$planDeletedPatient->id}/email")
            ->assertStatus(422);

        Event::assertNotDispatched(TreatmentPlanEmailRequested::class);
    }

    public function test_sixth_request_in_same_minute_by_same_user_returns_429_without_blocking_others(): void
    {
        Event::fake([TreatmentPlanEmailRequested::class]);

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($this->adminA, 'clinic')
                ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
                ->assertStatus(202);
        }

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
            ->assertStatus(429);

        Event::assertDispatchedTimes(TreatmentPlanEmailRequested::class, 5);

        $otherUser = ClinicUser::factory()->create([
            'clinic_id' => $this->adminA->clinic_id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($otherUser, 'clinic')
            ->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
            ->assertStatus(202);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $this->postJson("/api/clinic/treatment-plans/{$this->planA->id}/email")
            ->assertUnauthorized();
    }
}
