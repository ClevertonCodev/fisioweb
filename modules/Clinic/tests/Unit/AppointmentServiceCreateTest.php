<?php

namespace Modules\Clinic\Tests\Unit;

use Illuminate\Support\Facades\Queue;
use Mockery;
use Modules\Clinic\Contracts\AppointmentRepositoryInterface;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Jobs\AppointmentScheduledNotificationJob;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Services\AppointmentService;
use Tests\TestCase;

class AppointmentServiceCreateTest extends TestCase
{
    public function test_create_forces_scheduled_status_and_system_source(): void
    {
        Queue::fake();

        $appointment     = Mockery::mock(Appointment::class)->makePartial();
        $appointment->id = 1;
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
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
