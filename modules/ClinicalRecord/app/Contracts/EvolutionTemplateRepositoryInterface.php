<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\EvolutionTemplate;

interface EvolutionTemplateRepositoryInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function find(int $id): EvolutionTemplate;

    public function create(array $data): EvolutionTemplate;

    public function update(EvolutionTemplate $template, array $data): EvolutionTemplate;

    public function syncSections(EvolutionTemplate $template, array $sections): void;

    /**
     * @return array<int, int>
     */
    public function sectionIdsForTemplate(EvolutionTemplate $template): array;

    /**
     * @return array<int, int>
     */
    public function itemIdsForTemplate(EvolutionTemplate $template): array;

    public function hasEvolutions(EvolutionTemplate $template): bool;

    public function delete(EvolutionTemplate $template): void;
}
