<?php

namespace Modules\Admin\Contracts\Public;

/**
 * Snapshot mínimo dos defaults de prescrição de um exercício do catálogo Admin,
 * consumido por outros módulos (ex.: TreatmentProgram) sem acesso ao Model.
 */
final readonly class ExercisePrescriptionDefaults
{
    public function __construct(
        public int $exerciseId,
        public ?int $sets,
        public ?int $repetitions,
        public ?int $restTime,
    ) {}
}
