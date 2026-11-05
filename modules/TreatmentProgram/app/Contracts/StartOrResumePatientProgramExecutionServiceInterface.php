<?php

namespace Modules\TreatmentProgram\Contracts;

interface StartOrResumePatientProgramExecutionServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array;
}
