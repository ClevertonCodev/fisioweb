<?php

namespace Modules\ClinicalRecord\Events;

use Carbon\CarbonImmutable;

final readonly class AssessmentUpdated
{
    public function __construct(
        public int $version,
        public int $assessmentId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public ?int $templateId,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
