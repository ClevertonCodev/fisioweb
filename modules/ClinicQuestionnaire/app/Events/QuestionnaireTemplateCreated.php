<?php

namespace Modules\ClinicQuestionnaire\Events;

use Carbon\CarbonImmutable;

final readonly class QuestionnaireTemplateCreated
{
    public function __construct(
        public int $version,
        public int $templateId,
        public int $clinicId,
        public string $title,
        public CarbonImmutable $occurredAt,
    ) {}
}
