<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\EvolutionTemplate;

interface EvolutionTemplateServiceInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function find(int $id): EvolutionTemplate;

    public function create(array $dto, int $clinicId): EvolutionTemplate;

    public function update(EvolutionTemplate $template, array $dto): EvolutionTemplate;

    public function destroy(EvolutionTemplate $template): void;
}
