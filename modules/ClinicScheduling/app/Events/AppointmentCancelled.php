<?php

namespace Modules\ClinicScheduling\Events;

use Carbon\CarbonImmutable;

final readonly class AppointmentCancelled
{
    public function __construct(
        public int $version,
        public int $appointmentId,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $startsAt,
        public string $endsAt,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
