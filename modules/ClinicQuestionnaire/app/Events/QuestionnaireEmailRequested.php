<?php

namespace Modules\ClinicQuestionnaire\Events;

use Carbon\CarbonImmutable;

final readonly class QuestionnaireEmailRequested
{
    public function __construct(
        public int $version,
        public int $clinicId,
        public int $patientQuestionnaireId,
        public int $patientId,
        public ?int $actorId,
        public CarbonImmutable $occurredAt,
    ) {}
}
