<?php

namespace Modules\ClinicQuestionnaire\Events;

use Carbon\CarbonImmutable;

final readonly class QuestionnaireExpired
{
    public function __construct(
        public int $version,
        public int $patientQuestionnaireId,
        public int $clinicId,
        public int $patientId,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
