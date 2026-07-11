<?php

namespace Modules\ClinicScheduling\Data\Public;

use Carbon\CarbonImmutable;

final readonly class AppointmentExternalEventDTO
{
    public function __construct(
        public int $clinicId,
        public int $clinicUserId,
        public ?int $patientId,
        public string $externalEventId,
        public string $title,
        public ?string $description,
        public ?string $location,
        public CarbonImmutable $startsAt,
        public CarbonImmutable $endsAt,
        public string $status,
        public string $source,
        public CarbonImmutable $syncedAt,
    ) {}
}
