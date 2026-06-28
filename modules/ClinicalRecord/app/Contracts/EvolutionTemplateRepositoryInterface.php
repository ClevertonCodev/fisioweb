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

    public function replaceSections(EvolutionTemplate $template, array $sections): void;

    public function hasEvolutions(EvolutionTemplate $template): bool;

    public function delete(EvolutionTemplate $template): void;
}
