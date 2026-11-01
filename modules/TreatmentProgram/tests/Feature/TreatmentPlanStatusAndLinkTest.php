<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

/**
 * A situação do programa é decidida no backend, e o link do paciente muda
 * quando o paciente muda (ADR 025).
 */
class TreatmentPlanStatusAndLinkTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Queue::fake();
        $this->setUpPatientProgramFixtures();
    }

    public function test_create_without_status_is_active_with_patient_and_draft_without(): void
    {
        Event::fake([TreatmentPlanActivated::class]);
        $patient = $this->createPatient();

        $withPatient = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', ['title' => 'Joelho', 'patient_id' => $patient->id])
            ->assertCreated();
        $withoutPatient = $this->actingAs($this->clinicUser, 'clinic')
            ->postJson('/api/clinic/treatment-plans', ['title' => 'Modelo de joelho'])
            ->assertCreated();

        $this->assertSame(TreatmentPlan::STATUS_ACTIVE, TreatmentPlan::find($withPatient->json('data.id'))->status);
        $this->assertSame(TreatmentPlan::STATUS_DRAFT, TreatmentPlan::find($withoutPatient->json('data.id'))->status);
        Event::assertDispatchedTimes(TreatmentPlanActivated::class, 1);
    }

    public function test_draft_that_gets_a_patient_becomes_active(): void
    {
        Event::fake([TreatmentPlanActivated::class]);
        $draft = $this->draftWithoutPatient();

        $this->putPlan($draft, ['patient_id' => $this->createPatient()->id])->assertOk();

        $this->assertSame(TreatmentPlan::STATUS_ACTIVE, $draft->fresh()->status);
        Event::assertDispatchedTimes(TreatmentPlanActivated::class, 1);
    }

    public function test_editing_completed_or_archived_program_does_not_reactivate_it(): void
    {
        $patient = $this->createPatient();
        foreach ([TreatmentPlan::STATUS_COMPLETED, TreatmentPlan::STATUS_CANCELLED] as $status) {
            $plan = $this->activePlanOf($patient, ['status' => $status]);

            $this->putPlan($plan, ['title' => 'Título novo', 'patient_id' => $patient->id])->assertOk();

            $this->assertSame($status, $plan->fresh()->status);
        }
    }

    public function test_removing_the_patient_turns_the_program_into_a_draft(): void
    {
        $plan = $this->activePlanOf($this->createPatient());

        $this->putPlan($plan, ['patient_id' => null])->assertOk();

        $this->assertNull($plan->fresh()->patient_id);
        $this->assertSame(TreatmentPlan::STATUS_DRAFT, $plan->fresh()->status);
    }

    public function test_explicit_status_is_still_honored(): void
    {
        $patient = $this->createPatient();
        $plan    = $this->activePlanOf($patient);

        $this->putPlan($plan, ['patient_id' => $patient->id, 'status' => TreatmentPlan::STATUS_COMPLETED])->assertOk();

        $this->assertSame(TreatmentPlan::STATUS_COMPLETED, $plan->fresh()->status);
    }

    public function test_switching_patient_gives_a_new_link_and_the_old_one_stops_working(): void
    {
        $plan     = $this->activePlanOf($this->createPatient());
        $oldToken = $plan->public_token;

        $response = $this->putPlan($plan, ['patient_id' => $this->createPatient()->id])->assertOk();

        $newToken = $plan->fresh()->public_token;
        $this->assertNotSame($oldToken, $newToken);
        $this->assertStringContainsString($newToken, (string) $response->json('data.share_url'));
        $this->getJson("/api/patient/programs/{$oldToken}")->assertNotFound();
        $this->postJson("/api/patient/programs/{$oldToken}/executions")->assertNotFound();
        $this->getJson("/api/patient/programs/{$newToken}")->assertOk();
    }

    public function test_removing_the_patient_also_changes_the_link(): void
    {
        $plan     = $this->activePlanOf($this->createPatient());
        $oldToken = $plan->public_token;

        $this->putPlan($plan, ['patient_id' => null])->assertOk();

        $this->assertNotSame($oldToken, $plan->fresh()->public_token);
        $this->getJson("/api/patient/programs/{$oldToken}")->assertNotFound();
    }

    public function test_editing_without_changing_the_patient_keeps_the_link(): void
    {
        $patient = $this->createPatient();
        $plan    = $this->activePlanOf($patient);
        $token   = $plan->public_token;

        $this->putPlan($plan, ['title' => 'Novo título', 'patient_id' => $patient->id])->assertOk();
        $this->putPlan($plan, ['title' => 'Outro título'])->assertOk();

        $this->assertSame($token, $plan->fresh()->public_token);
    }

    public function test_new_patient_does_not_see_what_the_previous_one_registered(): void
    {
        ['plan' => $plan, 'planExercise' => $planExercise] = $this->createActiveProgram($this->createPatient());
        $executionId                                       = $this->postJson("/api/patient/programs/{$plan->public_token}/executions")->json('data.id');
        $this->postJson("/api/patient/programs/{$plan->public_token}/executions/{$executionId}/series", [
            'exercise_id' => $planExercise->id,
            'series'      => [['count' => 10, 'weight_value' => '8', 'weight_unit' => 'kg', 'is_bodyweight' => false]],
        ])->assertOk();

        $this->putPlan($plan, ['patient_id' => $this->createPatient()->id])->assertOk();
        $newToken = $plan->fresh()->public_token;

        $start = $this->postJson("/api/patient/programs/{$newToken}/executions")->assertOk();
        $this->assertFalse($start->json('data.resumed'));
        $this->assertNotSame($executionId, $start->json('data.id'));
        // Uma chave por exercício; nenhuma com a carga do paciente anterior.
        $this->assertSame([null], array_values(array_unique($start->json('data.last_loads'), SORT_REGULAR)));
    }

    public function test_switching_patient_resets_what_the_previous_one_saw_and_completed(): void
    {
        $plan = $this->activePlanOf($this->createPatient(), [
            'patient_viewed_at'       => now()->subDay(),
            'patient_completed_count' => 3,
        ]);

        $this->putPlan($plan, ['patient_id' => $this->createPatient()->id])->assertOk();

        $fresh = $plan->fresh();
        $this->assertNull($fresh->patient_viewed_at);
        $this->assertSame(0, $fresh->patient_completed_count);
    }

    public function test_editing_without_changing_the_patient_keeps_what_was_seen_and_completed(): void
    {
        $patient = $this->createPatient();
        $plan    = $this->activePlanOf($patient, ['patient_completed_count' => 2]);

        $this->putPlan($plan, ['title' => 'Outro', 'patient_id' => $patient->id])->assertOk();

        $this->assertSame(2, $plan->fresh()->patient_completed_count);
    }

    public function test_draft_that_already_had_the_patient_is_sent_when_saved_with_the_patient(): void
    {
        // Salvar com paciente é enviar (o assistente abre o diálogo de envio):
        // um rascunho antigo que já tinha o paciente vira ativo, senão o link
        // mostrado no diálogo daria 404 (link público não abre rascunho).
        $patient = $this->createPatient();
        $plan    = $this->activePlanOf($patient, ['status' => TreatmentPlan::STATUS_DRAFT]);

        $this->putPlan($plan, ['title' => 'Só o título', 'patient_id' => $patient->id])->assertOk();

        $this->assertSame(TreatmentPlan::STATUS_ACTIVE, $plan->fresh()->status);
        $this->getJson("/api/patient/programs/{$plan->public_token}")->assertOk();
    }

    // ------------------------------------------------------------ apoio

    private function putPlan(TreatmentPlan $plan, array $payload)
    {
        return $this->actingAs($this->clinicUser, 'clinic')
            ->putJson("/api/clinic/treatment-plans/{$plan->id}", $payload);
    }

    private function draftWithoutPatient(): TreatmentPlan
    {
        return TreatmentPlan::create([
            'clinic_id'      => $this->clinicUser->clinic_id,
            'clinic_user_id' => $this->clinicUser->id,
            'title'          => 'Rascunho',
            'status'         => TreatmentPlan::STATUS_DRAFT,
        ]);
    }

    private function activePlanOf(Patient $patient, array $overrides = []): TreatmentPlan
    {
        return $this->createActiveProgram($patient, $overrides)['plan'];
    }
}
