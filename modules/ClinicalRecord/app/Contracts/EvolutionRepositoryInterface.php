<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\PatientEvolution;

interface EvolutionRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): PatientEvolution;

    public function create(array $data): PatientEvolution;

    public function update(PatientEvolution $evolution, array $data): PatientEvolution;

    public function findTemplateItems(array $checkedItemIds): Collection;

    public function replaceCheckedItems(PatientEvolution $evolution, array $checkedItemIds, array $freeTextValues): void;
}
