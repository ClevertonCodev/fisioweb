<?php

namespace Modules\ClinicScheduling\Events;

use Carbon\CarbonImmutable;

final readonly class AppointmentEmailRequested
{
    public function __construct(
        public int $version,
        public int $clinicId,
        public int $appointmentId,
        public int $patientId,
        public ?int $actorId,
        public string $kind,
        public CarbonImmutable $occurredAt,
    ) {}
}
