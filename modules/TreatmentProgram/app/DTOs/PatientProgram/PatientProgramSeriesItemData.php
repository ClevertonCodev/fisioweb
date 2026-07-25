<?php

namespace Modules\TreatmentProgram\DTOs\PatientProgram;

readonly class PatientProgramSeriesItemData
{
    public function __construct(
        public ?int $count,
        public ?string $weightValue,
        public ?string $weightUnit,
        public bool $isBodyweight,
    ) {}

    /**
     * @return array{count: int|null, weight_value: string|null, weight_unit: string|null, is_bodyweight: bool}
     */
    public function toArray(): array
    {
        return [
            'count'          => $this->count,
            'weight_value'   => $this->weightValue,
            'weight_unit'    => $this->weightUnit,
            'is_bodyweight'  => $this->isBodyweight,
        ];
    }
}
