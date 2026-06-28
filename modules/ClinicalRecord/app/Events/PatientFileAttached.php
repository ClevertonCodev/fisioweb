<?php

namespace Modules\ClinicalRecord\Events;

use Carbon\CarbonImmutable;

final readonly class PatientFileAttached
{
    public function __construct(
        public int $version,
        public int $fileId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $originalName,
        public ?string $name,
        public string $mimeType,
        public int $size,
        public CarbonImmutable $occurredAt,
    ) {}
}
