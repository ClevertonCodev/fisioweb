<?php

namespace Modules\ClinicQuestionnaire\Events;

use Carbon\CarbonImmutable;

final readonly class QuestionnaireSent
{
    public function __construct(
        public int $version,
        public int $patientQuestionnaireId,
        public int $clinicId,
        public int $patientId,
        public ?int $clinicUserId,
        public int $templateId,
        public string $modality,
        public string $status,
        public ?CarbonImmutable $expiresAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
