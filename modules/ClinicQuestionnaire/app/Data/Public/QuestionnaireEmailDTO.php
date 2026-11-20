<?php

namespace Modules\ClinicQuestionnaire\Data\Public;

final readonly class QuestionnaireEmailDTO
{
    public function __construct(
        public int $id,
        public int $clinicId,
        public int $patientId,
        public string $title,
        public int $questionsCount,
        public ?string $expiresAt,
        public string $status,
        public ?string $shareUrl,
    ) {}
}
