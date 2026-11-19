<?php

namespace Modules\TreatmentProgram\Events;

use Carbon\CarbonImmutable;

final readonly class TreatmentPlanEmailRequested
{
    public function __construct(
        public int $version,
        public int $clinicId,
        public int $treatmentPlanId,
        public int $patientId,
        public ?int $actorId,
        public CarbonImmutable $occurredAt,
    ) {}
}
