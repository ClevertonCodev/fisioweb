<?php

namespace Modules\TreatmentProgram\Events;

use Carbon\CarbonImmutable;

final readonly class TreatmentPlanCreated
{
    public function __construct(
        public int $version,
        public int $treatmentPlanId,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
