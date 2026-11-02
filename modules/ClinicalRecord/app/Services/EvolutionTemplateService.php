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

            $this->repository->syncSections($template, $dto['sections'] ?? []);

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

        if (isset($dto['sections'])) {
            $this->ensureIdsBelongToTemplate($template, $dto['sections']);
        }

        return DB::transaction(function () use ($template, $dto) {
            $template = $this->repository->update($template, [
                'name'        => $dto['name'] ?? $template->name,
                'description' => array_key_exists('description', $dto) ? $dto['description'] : $template->description,
            ]);

            if (isset($dto['sections'])) {
                $this->repository->syncSections($template, $dto['sections']);
            }

            return $this->find($template->id);
        });
    }

    public function setActive(EvolutionTemplate $template, bool $isActive): EvolutionTemplate
    {
        if ($template->is_system) {
            throw ValidationException::withMessages([
                'template' => ['Templates do sistema não podem ser editados.'],
            ]);
        }

        $this->repository->update($template, [
            'is_active' => $isActive,
        ]);

        return $this->find($template->id);
    }

    public function destroy(EvolutionTemplate $template): void
    {
        if ($template->is_system) {
            throw ValidationException::withMessages([
                'template' => ['Templates do sistema não podem ser removidos.'],
            ]);
        }

        $this->repository->delete($template);
    }

    private function ensureIdsBelongToTemplate(EvolutionTemplate $template, array $sections): void
    {
        $validSectionIds = array_flip($this->repository->sectionIdsForTemplate($template));
        $validItemIds    = array_flip($this->repository->itemIdsForTemplate($template));
        $seenSectionIds  = [];
        $seenItemIds     = [];
        $errors          = [];

        foreach ($sections as $sIndex => $section) {
            if (isset($section['id'])) {
                $sectionId = (int) $section['id'];
                if (isset($seenSectionIds[$sectionId])) {
                    $errors["sections.{$sIndex}.id"] = 'Seção repetida no modelo.';
                } elseif (!isset($validSectionIds[$sectionId])) {
                    $errors["sections.{$sIndex}.id"] = 'A seção informada não pertence a este modelo.';
                }
                $seenSectionIds[$sectionId] = true;
            }

            foreach ($section['items'] ?? [] as $iIndex => $item) {
                if (!isset($item['id'])) {
                    continue;
                }
                $itemId = (int) $item['id'];
                if (isset($seenItemIds[$itemId])) {
                    $errors["sections.{$sIndex}.items.{$iIndex}.id"] = 'Item repetido no modelo.';
                } elseif (!isset($validItemIds[$itemId])) {
                    $errors["sections.{$sIndex}.items.{$iIndex}.id"] = 'O item informado não pertence a este modelo.';
                }
                $seenItemIds[$itemId] = true;
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }
}
