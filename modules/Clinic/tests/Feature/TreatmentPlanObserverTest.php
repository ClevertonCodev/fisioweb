<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Patient\Models\Patient;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;
use Tests\TestCase;

class TreatmentPlanObserverTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatches_whatsapp_job_when_plan_is_created_as_active_for_patient(): void
    {
        Queue::fake();

        $clinicUser = ClinicUser::factory()->create();
        $patient    = Patient::factory()->create([
            'clinic_id' => $clinicUser->clinic_id,
            'phone'     => '(11) 99999-8888',
        ]);

        TreatmentPlan::create([
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Plano ativo',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'message'        => 'Seu programa foi liberado.',
        ]);

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($patient) {
            return $job->to === $patient->phone && $job->body === 'Seu programa foi liberado.';
        });
    }

    public function test_dispatches_whatsapp_job_when_plan_status_changes_to_active(): void
    {
        Queue::fake();

        $clinicUser = ClinicUser::factory()->create();
        $patient    = Patient::factory()->create([
            'clinic_id' => $clinicUser->clinic_id,
            'phone'     => '11988887777',
        ]);

        $plan = TreatmentPlan::create([
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Plano rascunho',
            'status'         => TreatmentPlan::STATUS_DRAFT,
            'message'        => '',
        ]);

        Queue::assertNothingPushed();

        $plan->update(['status' => TreatmentPlan::STATUS_ACTIVE]);

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($patient) {
            return $job->to === $patient->phone
                && $job->body === 'Ola! Seu programa de tratamento esta disponivel no app.';
        });
    }
}
