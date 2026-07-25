<?php

namespace Modules\TreatmentProgram\DTOs\PatientProgram;

readonly class SavePatientProgramSeriesData
{
    /**
     * @param  list<PatientProgramSeriesItemData>  $series
     */
    public function __construct(
        public int $exerciseId,
        public array $series,
    ) {}
}
