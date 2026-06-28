<?php

namespace Modules\ClinicalRecord\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateRepositoryInterface;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateServiceInterface;
use Modules\ClinicalRecord\Models\EvolutionTemplate;

class EvolutionTemplateService implements EvolutionTemplateServiceInterface
{
    public function __construct(
        protected EvolutionTemplateRepositoryInterface $repository,
    ) {}

    public function listForClinic(int $clinicId): Collection
    {
        return $this->repository->listForClinic($clinicId);
    }

    public function find(int $id): EvolutionTemplate
    {
        return $this->repository->find($id);
    }

    public function create(array $dto, int $clinicId): EvolutionTemplate
    {
        return DB::transaction(function () use ($dto, $clinicId) {
            $template = $this->repository->create([
                'clinic_id'   => $clinicId,
                'name'        => $dto['name'],
                'description' => $dto['description'] ?? null,
                'is_system'   => false,
                'is_active'   => true,
            ]);

            $this->repository->replaceSections($template, $dto['sections'] ?? []);

            return $this->find($template->id);
        });
    }

    public function update(EvolutionTemplate $template, array $dto): EvolutionTemplate
    {
        if ($template->is_system) {
            throw ValidationException::withMessages([
                'template' => ['Templates do sistema não podem ser editados.'],
            ]);
        }

        return DB::transaction(function () use ($template, $dto) {
            $template = $this->repository->update($template, [
                'name'        => $dto['name'] ?? $template->name,
                'description' => array_key_exists('description', $dto) ? $dto['description'] : $template->description,
            ]);

            if (isset($dto['sections'])) {
                $this->repository->replaceSections($template, $dto['sections']);
            }

            return $this->find($template->id);
        });
    }

    public function destroy(EvolutionTemplate $template): void
    {
        if ($template->is_system) {
            throw ValidationException::withMessages([
                'template' => ['Templates do sistema não podem ser removidos.'],
            ]);
        }

        if ($this->repository->hasEvolutions($template)) {
            throw ValidationException::withMessages([
                'template' => ['Este template possui evoluções vinculadas e não pode ser removido.'],
            ]);
        }

        $this->repository->delete($template);
    }
}
