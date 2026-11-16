<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\PatientEvolution;

interface EvolutionServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): PatientEvolution;

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): PatientEvolution;

    public function update(PatientEvolution $evolution, array $dto): PatientEvolution;

    /**
     * @param  array<int, int|string>  $checkedItemIds
     * @param  array<int, array{item_id: int|string, value: string}>  $freeTextValues
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function generateText(PatientEvolution $evolution, array $checkedItemIds, array $freeTextValues): string;

    public function sign(PatientEvolution $evolution, int $clinicUserId): PatientEvolution;

    public function destroy(PatientEvolution $evolution): void;
}
