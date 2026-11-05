<?php

namespace Modules\TreatmentProgram\Contracts;

interface CompletePatientProgramServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array;
}
