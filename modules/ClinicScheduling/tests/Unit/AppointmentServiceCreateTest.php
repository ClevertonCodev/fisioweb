<?php

namespace Modules\ClinicScheduling\Tests\Unit;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\ClinicScheduling\Jobs\AppointmentScheduledNotificationJob;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\ClinicScheduling\Services\AppointmentService;
use Tests\TestCase;

class AppointmentServiceCreateTest extends TestCase
{
    public function test_create_forces_scheduled_status_and_system_source(): void
    {
        Queue::fake();
        Event::fake();

        $appointment                 = Mockery::mock(Appointment::class)->makePartial();
        $appointment->id             = 1;
        $appointment->clinic_id      = 1;
        $appointment->patient_id     = 1;
        $appointment->clinic_user_id = 1;
        $appointment->status         = AppointmentStatus::Scheduled;
        $appointment->starts_at      = now()->addDay();
        $appointment->ends_at        = now()->addDay()->addHour();
        $appointment->shouldReceive('load')->andReturnSelf();

        $repository = Mockery::mock(AppointmentRepositoryInterface::class);
        $repository->shouldReceive('create')
            ->once()
            ->with(Mockery::on(function (array $data) {
                return $data['status'] === AppointmentStatus::Scheduled
                    && $data['source'] === Appointment::SOURCE_SYSTEM;
            }))
            ->andReturn($appointment);

        $service = new AppointmentService($repository);
        $result  = $service->create([
            'clinic_id'      => 1,
            'patient_id'     => 1,
            'clinic_user_id' => 1,
            'starts_at'      => now()->addDay(),
            'ends_at'        => now()->addDay()->addHour(),
        ]);

        $this->assertSame($appointment, $result);
        Queue::assertPushed(AppointmentScheduledNotificationJob::class);
        Event::assertDispatched(AppointmentScheduled::class);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
