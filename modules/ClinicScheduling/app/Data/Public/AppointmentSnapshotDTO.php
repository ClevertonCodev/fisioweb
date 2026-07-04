<?php

namespace Modules\ClinicScheduling\Data\Public;

use Carbon\CarbonImmutable;

final readonly class AppointmentSnapshotDTO
{
    public function __construct(
        public int $id,
        public int $clinicId,
        public ?int $clinicUserId,
        public ?int $patientId,
        public ?string $title,
        public ?string $description,
        public ?string $location,
        public CarbonImmutable $startsAt,
        public CarbonImmutable $endsAt,
        public string $timezone,
        public ?string $googleEventId,
        public string $status,
    ) {}
}
