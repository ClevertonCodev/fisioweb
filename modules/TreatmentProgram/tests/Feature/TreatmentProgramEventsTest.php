<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Contracts\ProgramDraftServiceInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanServiceInterface;
use Modules\TreatmentProgram\Events\ProgramDraftConvertedToTreatmentPlan;
use Modules\TreatmentProgram\Events\ProgramDraftCreated;
use Modules\TreatmentProgram\Events\ProgramDraftUpdated;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Events\TreatmentPlanArchived;
use Modules\TreatmentProgram\Events\TreatmentPlanCompleted;
use Modules\TreatmentProgram\Events\TreatmentPlanCreated;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Tests\TestCase;

class TreatmentProgramEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_plan_create_activate_complete_archive_and_draft_conversion_dispatch_events(): void
    {
        Event::fake();

        [$clinicUser, $patient] = $this->context();
        $this->actingAs($clinicUser, 'clinic');

        app(ProgramDraftServiceInterface::class)->upsertForUser(
            (int) $clinicUser->clinic_id,
            (int) $clinicUser->id,
            $this->draftPayload(),
        );

        $plan = app(TreatmentPlanServiceInterface::class)->create([
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Plano com eventos',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'start_date'     => '2026-07-01',
        ]);

        app(TreatmentPlanServiceInterface::class)->update($plan->id, [
            'status'   => TreatmentPlan::STATUS_COMPLETED,
            'end_date' => '2026-07-20',
        ]);

        $second = app(TreatmentPlanServiceInterface::class)->create([
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Plano arquivado',
            'status'         => TreatmentPlan::STATUS_DRAFT,
        ]);

        app(TreatmentPlanServiceInterface::class)->update($second->id, [
            'status' => TreatmentPlan::STATUS_CANCELLED,
        ]);

        Event::assertDispatched(TreatmentPlanCreated::class, function (TreatmentPlanCreated $event) use ($plan, $clinicUser, $patient) {
            return $event->version === 1
                && $event->treatmentPlanId === $plan->id
                && $event->clinicId === $clinicUser->clinic_id
                && $event->patientId === $patient->id
                && $event->actorId === $clinicUser->id
                && $event->status === TreatmentPlan::STATUS_ACTIVE;
        });

        Event::assertDispatched(TreatmentPlanActivated::class, function (TreatmentPlanActivated $event) use ($plan, $patient) {
            return $event->treatmentPlanId === $plan->id
                && $event->patientId === $patient->id
                && $event->startedAt === '2026-07-01';
        });

        Event::assertDispatched(TreatmentPlanCompleted::class, function (TreatmentPlanCompleted $event) use ($plan, $patient) {
            return $event->treatmentPlanId === $plan->id
                && $event->patientId === $patient->id
                && $event->completedAt === '2026-07-20';
        });

        Event::assertDispatched(TreatmentPlanArchived::class, function (TreatmentPlanArchived $event) use ($second) {
            return $event->treatmentPlanId === $second->id
                && $event->status === TreatmentPlan::STATUS_CANCELLED;
        });

        Event::assertDispatched(ProgramDraftConvertedToTreatmentPlan::class, function (ProgramDraftConvertedToTreatmentPlan $event) use ($plan, $clinicUser) {
            return $event->treatmentPlanId === $plan->id
                && $event->clinicUserId === $clinicUser->id;
        });
    }

    public function test_program_draft_upsert_dispatches_created_then_updated_events(): void
    {
        Event::fake();

        [$clinicUser] = $this->context();
        $service      = app(ProgramDraftServiceInterface::class);

        $service->upsertForUser((int) $clinicUser->clinic_id, (int) $clinicUser->id, $this->draftPayload());
        $service->upsertForUser((int) $clinicUser->clinic_id, (int) $clinicUser->id, $this->draftPayload(['step' => 3]));

        Event::assertDispatched(ProgramDraftCreated::class, function (ProgramDraftCreated $event) use ($clinicUser) {
            return $event->clinicId === $clinicUser->clinic_id
                && $event->clinicUserId === $clinicUser->id;
        });

        Event::assertDispatched(ProgramDraftUpdated::class, function (ProgramDraftUpdated $event) use ($clinicUser) {
            return $event->clinicId === $clinicUser->clinic_id
                && $event->clinicUserId === $clinicUser->id;
        });
    }

    /**
     * @return array{0: ClinicUser, 1: Patient}
     */
    private function context(): array
    {
        $clinicUser = ClinicUser::factory()->create();
        $patient    = Patient::factory()->create(['clinic_id' => $clinicUser->clinic_id]);

        return [$clinicUser, $patient];
    }

    private function draftPayload(array $overrides = []): array
    {
        return array_merge([
            'step'        => 2,
            'selectedIds' => ['ex-1'],
            'groups'      => [],
            'savedAt'     => 1711840000000,
        ], $overrides);
    }
}
