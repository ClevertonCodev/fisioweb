<?php

namespace Modules\ClinicScheduling\Tests\Unit\Events;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentCompleted;
use Modules\ClinicScheduling\Events\AppointmentRescheduled;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\ClinicScheduling\Services\AppointmentService;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentServiceEventsTest extends TestCase
{
    use RefreshDatabase;

    public function test_use_cases_dispatch_minimal_snapshot_events(): void
    {
        Event::fake();

        [$clinic, $physio, $patient] = $this->context();
        $this->actingAs($physio, 'clinic');

        $service = app(AppointmentService::class);

        // create → AppointmentScheduled
        $appointment = $service->create([
            'clinic_id'      => $clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $physio->id,
            'starts_at'      => now()->subHour(),
            'ends_at'        => now()->subHour()->addMinutes(30),
        ]);

        // update → AppointmentRescheduled
        $service->update($appointment->id, ['title' => 'Retorno']);

        // updateStatus(completed) → AppointmentCompleted (starts_at no passado)
        $service->updateStatus($appointment->id, AppointmentStatus::Completed);

        // cancel de outra consulta → AppointmentCancelled
        $second = $service->create([
            'clinic_id'      => $clinic->id,
            'patient_id'     => $patient->id,
            'clinic_user_id' => $physio->id,
            'starts_at'      => now()->addDay(),
            'ends_at'        => now()->addDay()->addHour(),
        ]);
        $service->cancel($second->id);

        Event::assertDispatched(AppointmentScheduled::class, function (AppointmentScheduled $e) use ($clinic, $appointment) {
            return $e->appointmentId === $appointment->id
                && $e->clinicId === $clinic->id
                && $e->version === 1
                && $e->status === AppointmentStatus::Scheduled->value;
        });
        Event::assertDispatched(AppointmentRescheduled::class);
        Event::assertDispatched(AppointmentCompleted::class);
        Event::assertDispatched(AppointmentCancelled::class);
    }

    /**
     * @return array{0: Clinic, 1: ClinicUser, 2: Patient}
     */
    private function context(): array
    {
        $clinic = Clinic::factory()->create();
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);
        $patient = Patient::factory()->create(['clinic_id' => $clinic->id]);

        return [$clinic, $physio, $patient];
    }
}
