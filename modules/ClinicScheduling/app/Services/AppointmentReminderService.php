<?php

namespace Modules\ClinicScheduling\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Event;
use Modules\ClinicScheduling\Contracts\AppointmentReminderServiceInterface;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;

class AppointmentReminderService implements AppointmentReminderServiceInterface
{
    private const EVENT_VERSION = 1;

    private const WINDOW_START_HOURS = 23;

    private const WINDOW_END_HOURS = 24;

    public function __construct(
        protected AppointmentRepositoryInterface $appointments,
    ) {}

    public function dispatchDue(CarbonImmutable $now): int
    {
        $hour       = $now->startOfHour();
        $dispatched = 0;

        $due = $this->appointments->dueForReminder(
            $hour->addHours(self::WINDOW_START_HOURS),
            $hour->addHours(self::WINDOW_END_HOURS),
        );

        foreach ($due as $appointment) {
            Event::dispatch(new AppointmentReminderDue(
                version: self::EVENT_VERSION,
                clinicId: (int) $appointment->clinic_id,
                appointmentId: (int) $appointment->id,
                patientId: (int) $appointment->patient_id,
                startsAt: CarbonImmutable::instance($appointment->starts_at),
                occurredAt: $now,
            ));

            $dispatched++;
        }

        return $dispatched;
    }
}
