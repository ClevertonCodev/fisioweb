<?php

namespace Modules\TreatmentProgram\Data\Public;

final readonly class TreatmentPlanEmailDTO
{
    public function __construct(
        public int $id,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public string $title,
        public ?string $message,
        public ?string $startDate,
        public ?string $endDate,
        public int $exercisesCount,
        public string $status,
        public ?string $shareUrl,
    ) {}
}
