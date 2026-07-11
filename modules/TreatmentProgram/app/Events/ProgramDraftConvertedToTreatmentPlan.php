<?php

namespace Modules\TreatmentProgram\Events;

use Carbon\CarbonImmutable;

final readonly class ProgramDraftConvertedToTreatmentPlan
{
    public function __construct(
        public int $version,
        public int $programDraftId,
        public int $treatmentPlanId,
        public int $clinicId,
        public int $clinicUserId,
        public CarbonImmutable $occurredAt,
    ) {}
}
