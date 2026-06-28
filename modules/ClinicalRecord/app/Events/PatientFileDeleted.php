<?php

namespace Modules\ClinicalRecord\Events;

use Carbon\CarbonImmutable;

final readonly class PatientFileDeleted
{
    public function __construct(
        public int $version,
        public int $fileId,
        public int $clinicId,
        public int $patientId,
        public ?int $actorId,
        public CarbonImmutable $occurredAt,
    ) {}
}
