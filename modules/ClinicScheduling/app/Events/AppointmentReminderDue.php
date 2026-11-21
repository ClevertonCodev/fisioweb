<?php

namespace Modules\ClinicScheduling\Events;

use Carbon\CarbonImmutable;

final readonly class AppointmentReminderDue
{
    public function __construct(
        public int $version,
        public int $clinicId,
        public int $appointmentId,
        public int $patientId,
        public CarbonImmutable $startsAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
