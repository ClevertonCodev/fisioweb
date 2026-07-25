<?php

namespace Modules\TreatmentProgram\DTOs\PatientProgram;

readonly class UpdateUnfinishedExercisesData
{
    /**
     * @param  list<int>  $unfinishedExerciseIds
     */
    public function __construct(
        public array $unfinishedExerciseIds,
    ) {}
}
