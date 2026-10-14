<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
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
}
