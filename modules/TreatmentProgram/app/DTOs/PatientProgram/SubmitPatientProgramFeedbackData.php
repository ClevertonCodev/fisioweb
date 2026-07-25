<?php

namespace Modules\TreatmentProgram\DTOs\PatientProgram;

readonly class SubmitPatientProgramFeedbackData
{
    public function __construct(
        public ?int $pain,
        public ?string $painNotes,
        public ?int $difficulty,
        public ?string $difficultyNotes,
        public ?string $rating,
        public ?string $ratingNotes,
        public ?int $executionId,
    ) {}
}
