<?php

namespace Modules\ClinicQuestionnaire\Events;

use Carbon\CarbonImmutable;

final readonly class QuestionnaireAnswered
{
    public function __construct(
        public int $version,
        public int $patientQuestionnaireId,
        public int $clinicId,
        public int $patientId,
        public int $templateId,
        public string $status,
        public CarbonImmutable $answeredAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
