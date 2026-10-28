<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Events\TreatmentPlanCreated;
use Modules\TreatmentProgram\Models\ClinicProgramDraft;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Tests\TestCase;

class TreatmentPlanIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private TreatmentPlan $planA;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->adminA = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);
        $this->adminB = ClinicUser::factory()->create(['clinic_id' => Clinic::factory()->create()->id]);

        $this->planA = TreatmentPlan::create([
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
            'title'          => 'Plano da clínica A',
            'status'         => 'active',
        ]);
    }

    public function test_store_rejects_patient_of_another_clinic_without_leaking_or_dispatching(): void
    {
        Event::fake([TreatmentPlanCreated::class, TreatmentPlanActivated::class]);
        $patientB = Patient::factory()->create(['clinic_id' => $this->adminB->clinic_id]);
        $before   = TreatmentPlan::count();

        $response = $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'      => 'Tentativa com paciente da B',
                'patient_id' => $patientB->id,
                'status'     => 'active',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('patient_id');
        $response->assertJsonMissing(['name' => $patientB->name]);
        $this->assertStringNotContainsString((string) $patientB->cpf, $response->getContent());
        $this->assertSame($before, TreatmentPlan::count());
        Event::assertNotDispatched(TreatmentPlanCreated::class);
        Event::assertNotDispatched(TreatmentPlanActivated::class);
    }

    public function test_update_rejects_switching_to_patient_of_another_clinic(): void
    {
        Event::fake([TreatmentPlanActivated::class]);
        $patientB = Patient::factory()->create(['clinic_id' => $this->adminB->clinic_id]);

        $response = $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", [
                'patient_id' => $patientB->id,
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('patient_id');
        $response->assertJsonMissing(['name' => $patientB->name]);
        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'         => $this->planA->id,
            'patient_id' => null,
        ]);
        Event::assertNotDispatched(TreatmentPlanActivated::class);
    }

    public function test_update_keeps_plan_of_removed_patient_editable(): void
    {
        $patientA = Patient::factory()->create(['clinic_id' => $this->adminA->clinic_id]);
        $this->planA->update(['patient_id' => $patientA->id]);
        $patientA->delete();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", [
                'title'      => 'Plano editado depois da remoção',
                'patient_id' => $patientA->id,
            ])
            ->assertOk();

        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'         => $this->planA->id,
            'title'      => 'Plano editado depois da remoção',
            'patient_id' => $patientA->id,
        ]);
    }

    public function test_update_still_rejects_switching_to_removed_patient(): void
    {
        $removed = Patient::factory()->create(['clinic_id' => $this->adminA->clinic_id]);
        $removed->delete();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", ['patient_id' => $removed->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('patient_id');
    }

    public function test_store_and_update_accept_patient_of_own_clinic_and_no_patient(): void
    {
        $patientA = Patient::factory()->create(['clinic_id' => $this->adminA->clinic_id]);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/treatment-plans', [
                'title'      => 'Plano com paciente da A',
                'patient_id' => $patientA->id,
            ])
            ->assertCreated()
            ->assertJsonPath('data.patient_id', $patientA->id);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/treatment-plans', ['title' => 'Modelo sem paciente', 'patient_id' => null])
            ->assertCreated();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", ['patient_id' => $patientA->id])
            ->assertOk();
        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'         => $this->planA->id,
            'patient_id' => $patientA->id,
        ]);
    }

    public function test_store_creates_plan_in_own_clinic_authored_by_authenticated_user(): void
    {
        $id = $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/treatment-plans', ['title' => 'Novo plano A'])
            ->assertCreated()
            ->json('data.id');

        $this->assertDatabaseHas('clinic_treatment_plans', [
            'id'             => $id,
            'clinic_id'      => $this->adminA->clinic_id,
            'clinic_user_id' => $this->adminA->id,
        ]);
    }

    public function test_own_plan_can_be_read_updated_and_deleted(): void
    {
        $id = $this->planA->id;

        $this->actingAs($this->adminA, 'clinic')->getJson("/api/clinic/treatment-plans/{$id}")->assertOk()->assertJsonPath('data.id', $id);

        $this->actingAs($this->adminA, 'clinic')->putJson("/api/clinic/treatment-plans/{$id}", ['title' => 'Plano A editado'])->assertOk();
        $this->assertDatabaseHas('clinic_treatment_plans', ['id' => $id, 'title' => 'Plano A editado']);

        $this->actingAs($this->adminA, 'clinic')->deleteJson("/api/clinic/treatment-plans/{$id}")->assertOk();
        $this->assertDatabaseMissing('clinic_treatment_plans', ['id' => $id]);
    }

    public function test_plan_of_another_clinic_cannot_be_read_updated_or_deleted(): void
    {
        $id = $this->planA->id;

        $this->actingAs($this->adminB, 'clinic')->getJson("/api/clinic/treatment-plans/{$id}")->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->putJson("/api/clinic/treatment-plans/{$id}", ['title' => 'Alterado por B'])->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')->deleteJson("/api/clinic/treatment-plans/{$id}")->assertNotFound();

        $this->assertDatabaseHas('clinic_treatment_plans', ['id' => $id, 'title' => 'Plano da clínica A']);
    }

    public function test_update_of_another_clinic_plan_does_not_reveal_its_patient(): void
    {
        $patientA = Patient::factory()->create(['clinic_id' => $this->adminA->clinic_id]);
        $otherA   = Patient::factory()->create(['clinic_id' => $this->adminA->clinic_id]);
        $this->planA->update(['patient_id' => $patientA->id]);

        // Se o paciente certo desse uma resposta diferente de um qualquer, a
        // clínica B descobriria quem é o paciente do plano da A.
        $right = $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", ['patient_id' => $patientA->id]);
        $wrong = $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$this->planA->id}", ['patient_id' => $otherA->id]);

        $this->assertSame($wrong->status(), $right->status());
        $this->assertSame($wrong->getContent(), $right->getContent());
    }

    public function test_destroy_draft_removes_own_draft_only(): void
    {
        foreach ([$this->adminA, $this->adminB] as $user) {
            ClinicProgramDraft::create([
                'clinic_id'      => $user->clinic_id,
                'clinic_user_id' => $user->id,
                'draft_data'     => ['step' => 1, 'selectedIds' => [], 'groups' => [], 'savedAt' => 1],
            ]);
        }

        $this->actingAs($this->adminA, 'clinic')->deleteJson('/api/clinic/program-drafts')->assertOk();

        $this->assertDatabaseMissing('clinic_program_drafts', ['clinic_user_id' => $this->adminA->id]);
        $this->assertDatabaseHas('clinic_program_drafts', ['clinic_user_id' => $this->adminB->id]);
    }

    public function test_physiotherapist_cannot_delete_own_clinic_plan(): void
    {
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $this->adminA->clinic_id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($physio, 'clinic')
            ->deleteJson("/api/clinic/treatment-plans/{$this->planA->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('clinic_treatment_plans', ['id' => $this->planA->id]);
    }
}
