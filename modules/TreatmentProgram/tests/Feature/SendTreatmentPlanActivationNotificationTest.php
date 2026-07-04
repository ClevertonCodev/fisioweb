<?php

namespace Modules\TreatmentProgram\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Listeners\SendTreatmentPlanActivationNotification;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;
use Tests\TestCase;

class SendTreatmentPlanActivationNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_dispatches_whatsapp_job_for_active_plan_with_patient_phone(): void
    {
        Queue::fake();

        [$clinicUser, $patient, $plan] = $this->activePlan('Seu programa foi liberado.');

        app(SendTreatmentPlanActivationNotification::class)->handle(new TreatmentPlanActivated(
            1,
            (int) $plan->id,
            (int) $clinicUser->clinic_id,
            (int) $patient->id,
            (int) $clinicUser->id,
            (int) $clinicUser->id,
            TreatmentPlan::STATUS_ACTIVE,
            now()->toDateString(),
            now()->toImmutable(),
        ));

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($patient) {
            return $job->to === $patient->phone && $job->body === 'Seu programa foi liberado.';
        });
    }

    public function test_dispatches_fallback_message_when_plan_message_is_empty(): void
    {
        Queue::fake();

        [$clinicUser, $patient, $plan] = $this->activePlan('');

        app(SendTreatmentPlanActivationNotification::class)->handle(new TreatmentPlanActivated(
            1,
            (int) $plan->id,
            (int) $clinicUser->clinic_id,
            (int) $patient->id,
            (int) $clinicUser->id,
            (int) $clinicUser->id,
            TreatmentPlan::STATUS_ACTIVE,
            now()->toDateString(),
            now()->toImmutable(),
        ));

        Queue::assertPushed(SendWhatsAppMessageJob::class, function (SendWhatsAppMessageJob $job) use ($patient) {
            return $job->to === $patient->phone
                && $job->body === 'Ola! Seu programa de tratamento esta disponivel no app.';
        });
    }

    public function test_does_not_dispatch_when_patient_phone_is_empty(): void
    {
        Queue::fake();

        [$clinicUser, $patient, $plan] = $this->activePlan('Mensagem', ['phone' => null]);

        app(SendTreatmentPlanActivationNotification::class)->handle(new TreatmentPlanActivated(
            1,
            (int) $plan->id,
            (int) $clinicUser->clinic_id,
            (int) $patient->id,
            (int) $clinicUser->id,
            (int) $clinicUser->id,
            TreatmentPlan::STATUS_ACTIVE,
            now()->toDateString(),
            now()->toImmutable(),
        ));

        Queue::assertNothingPushed();
    }

    public function test_does_not_dispatch_when_patient_belongs_to_another_clinic(): void
    {
        Queue::fake();

        [$clinicUser, $patient, $plan] = $this->activePlan('Mensagem', [
            'clinic_id' => ClinicUser::factory()->create()->clinic_id,
        ]);

        app(SendTreatmentPlanActivationNotification::class)->handle(new TreatmentPlanActivated(
            1,
            (int) $plan->id,
            (int) $clinicUser->clinic_id,
            (int) $patient->id,
            (int) $clinicUser->id,
            (int) $clinicUser->id,
            TreatmentPlan::STATUS_ACTIVE,
            now()->toDateString(),
            now()->toImmutable(),
        ));

        Queue::assertNothingPushed();
    }

    /**
     * @return array{0: ClinicUser, 1: Patient, 2: TreatmentPlan}
     */
    private function activePlan(string $message, array $patientOverrides = []): array
    {
        $clinicUser = ClinicUser::factory()->create();
        $patient    = Patient::factory()->create(array_merge([
            'clinic_id' => $clinicUser->clinic_id,
            'phone'     => '(11) 99999-8888',
        ], $patientOverrides));

        $plan = TreatmentPlan::create([
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
            'patient_id'     => $patient->id,
            'title'          => 'Plano ativo',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
            'message'        => $message,
        ]);

        return [$clinicUser, $patient, $plan];
    }
}
