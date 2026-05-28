<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Support\Collection;
use Modules\Clinic\Models\PatientEvolution;

interface EvolutionServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): PatientEvolution;

    /**
     * @param  array{title: string, evolution_template_id?: int|null, checked_item_ids?: array, free_text_values?: array, generated_text?: string|null, notes?: string|null}  $dto
     */
    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): PatientEvolution;

    /**
     * @param  array{title?: string, checked_item_ids?: array, free_text_values?: array, generated_text?: string|null, notes?: string|null}  $dto
     */
    public function update(PatientEvolution $evolution, array $dto): PatientEvolution;

    /**
     * @param  array<int>  $checkedItemIds
     * @param  array<int, array{item_id: int, value: string}>  $freeTextValues
     */
    public function generateText(array $checkedItemIds, array $freeTextValues): string;

    public function sign(PatientEvolution $evolution, int $clinicUserId): PatientEvolution;

    public function destroy(PatientEvolution $evolution): void;
}
