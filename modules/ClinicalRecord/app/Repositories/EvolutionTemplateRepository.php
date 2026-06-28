<?php

namespace Modules\ClinicalRecord\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateRepositoryInterface;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\PatientEvolution;

class EvolutionTemplateRepository implements EvolutionTemplateRepositoryInterface
{
    public function listForClinic(int $clinicId): Collection
    {
        return EvolutionTemplate::query()
            ->availableForClinic($clinicId)
            ->active()
            ->with('sections.items')
            ->get();
    }

    public function find(int $id): EvolutionTemplate
    {
        return EvolutionTemplate::query()
            ->with('sections.items')
            ->findOrFail($id);
    }

    public function create(array $data): EvolutionTemplate
    {
        return EvolutionTemplate::query()->create($data);
    }

    public function update(EvolutionTemplate $template, array $data): EvolutionTemplate
    {
        $template->update($data);

        return $template->fresh();
    }

    public function replaceSections(EvolutionTemplate $template, array $sections): void
    {
        $template->sections()->each(fn ($section) => $section->items()->delete());
        $template->sections()->delete();

        foreach ($sections as $sectionData) {
            $section = $template->sections()->create([
                'title'      => $sectionData['title'],
                'sort_order' => $sectionData['sort_order'] ?? 0,
            ]);

            foreach ($sectionData['items'] ?? [] as $itemData) {
                $section->items()->create([
                    'label'                 => $itemData['label'],
                    'print_text'            => $itemData['print_text'],
                    'has_free_text'         => $itemData['has_free_text'] ?? false,
                    'free_text_placeholder' => $itemData['free_text_placeholder'] ?? null,
                    'sort_order'            => $itemData['sort_order'] ?? 0,
                ]);
            }
        }
    }

    public function hasEvolutions(EvolutionTemplate $template): bool
    {
        return PatientEvolution::query()
            ->where('evolution_template_id', $template->id)
            ->exists();
    }

    public function delete(EvolutionTemplate $template): void
    {
        $template->sections()->each(fn ($section) => $section->items()->delete());
        $template->sections()->delete();
        $template->delete();
    }
}
