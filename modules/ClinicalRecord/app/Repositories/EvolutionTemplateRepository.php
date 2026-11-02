<?php

namespace Modules\ClinicalRecord\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateRepositoryInterface;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\EvolutionTemplateItem;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\ClinicalRecord\Models\PatientEvolutionCheckedItem;

class EvolutionTemplateRepository implements EvolutionTemplateRepositoryInterface
{
    public function listForClinic(int $clinicId): Collection
    {
        return EvolutionTemplate::query()
            ->availableForClinic($clinicId)
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

    public function syncSections(EvolutionTemplate $template, array $sections): void
    {
        $existingSections = $template->allSections()->get()->keyBy('id');
        $existingItems    = $existingSections->isNotEmpty()
            ? EvolutionTemplateItem::query()
                ->whereIn('evolution_template_section_id', $existingSections->keys())
                ->get()
                ->keyBy('id')
            : collect();

        $keptSectionIds = [];
        $keptItemIds    = [];

        foreach ($sections as $sIndex => $sectionData) {
            $sectionId    = isset($sectionData['id']) ? (int) $sectionData['id'] : null;
            $sectionAttrs = [
                'title'       => $sectionData['title'],
                'sort_order'  => $sectionData['sort_order'] ?? $sIndex,
                'archived_at' => null,
            ];

            if (!is_null($sectionId) && $existingSections->has($sectionId)) {
                $section = $existingSections->get($sectionId);
                $section->update($sectionAttrs);
            } else {
                $section = $template->allSections()->create($sectionAttrs);
            }

            $keptSectionIds[] = (int) $section->id;

            foreach ($sectionData['items'] ?? [] as $iIndex => $itemData) {
                $itemId    = isset($itemData['id']) ? (int) $itemData['id'] : null;
                $itemAttrs = [
                    'evolution_template_section_id' => $section->id,
                    'label'                         => $itemData['label'],
                    'print_text'                    => $itemData['print_text'],
                    'has_free_text'                 => (bool) ($itemData['has_free_text'] ?? false),
                    'free_text_placeholder'         => $itemData['free_text_placeholder'] ?? null,
                    'sort_order'                    => $itemData['sort_order'] ?? $iIndex,
                    'archived_at'                   => null,
                ];

                if (!is_null($itemId) && $existingItems->has($itemId)) {
                    $item = $existingItems->get($itemId);
                    $item->update($itemAttrs);
                } else {
                    $item = $section->allItems()->create($itemAttrs);
                }

                $keptItemIds[] = (int) $item->id;
            }
        }

        if ($existingSections->isNotEmpty()) {
            EvolutionTemplateItem::query()
                ->whereIn('evolution_template_section_id', $existingSections->keys())
                ->whereNotIn('id', $keptItemIds)
                ->whereNull('archived_at')
                ->update(['archived_at' => now()]);
        }

        $template->allSections()
            ->whereNotIn('id', $keptSectionIds)
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);
    }

    public function sectionIdsForTemplate(EvolutionTemplate $template): array
    {
        return $template->allSections()
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function itemIdsForTemplate(EvolutionTemplate $template): array
    {
        $sectionIds = $this->sectionIdsForTemplate($template);
        if (empty($sectionIds)) {
            return [];
        }

        return EvolutionTemplateItem::query()
            ->whereIn('evolution_template_section_id', $sectionIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function hasEvolutions(EvolutionTemplate $template): bool
    {
        if (
            PatientEvolution::withTrashed()
                ->where('evolution_template_id', $template->id)
                ->exists()
        ) {
            return true;
        }

        $itemIds = $this->itemIdsForTemplate($template);
        if (empty($itemIds)) {
            return false;
        }

        return PatientEvolutionCheckedItem::query()
            ->whereIn('evolution_template_item_id', $itemIds)
            ->exists();
    }

    public function delete(EvolutionTemplate $template): void
    {
        if ($this->hasEvolutions($template)) {
            $template->delete();

            return;
        }

        $sectionIds = $this->sectionIdsForTemplate($template);
        if (!empty($sectionIds)) {
            EvolutionTemplateItem::query()
                ->whereIn('evolution_template_section_id', $sectionIds)
                ->delete();
        }
        $template->allSections()->delete();
        $template->forceDelete();
    }
}
