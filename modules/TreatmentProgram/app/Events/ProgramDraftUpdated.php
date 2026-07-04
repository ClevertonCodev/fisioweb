<?php

namespace Modules\TreatmentProgram\Events;

use Carbon\CarbonImmutable;

final readonly class ProgramDraftUpdated
{
    public function __construct(
        public int $version,
        public int $programDraftId,
        public int $clinicId,
        public int $clinicUserId,
        public CarbonImmutable $occurredAt,
    ) {}
}
