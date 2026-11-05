<?php

namespace Modules\TreatmentProgram\Contracts;

interface RegisterPatientProgramViewServiceInterface
{
    /**
     * @return array{viewed: bool}
     */
    public function execute(string $publicToken): array;
}
