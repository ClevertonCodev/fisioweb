<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Support\Collection;
use Modules\Clinic\Models\EvolutionTemplate;

interface EvolutionTemplateServiceInterface
{
    public function listForClinic(int $clinicId): Collection;

    public function find(int $id): EvolutionTemplate;

    /**
     * @param  array{name: string, description?: string|null, sections: array}  $dto
     */
    public function create(array $dto, int $clinicId): EvolutionTemplate;

    /**
     * @param  array{name?: string, description?: string|null, sections?: array}  $dto
     */
    public function update(EvolutionTemplate $template, array $dto): EvolutionTemplate;

    public function destroy(EvolutionTemplate $template): void;
}
