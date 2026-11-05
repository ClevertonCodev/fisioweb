<?php

namespace Modules\TreatmentProgram\Contracts;

interface GetPatientProgramDetailServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array;
}
