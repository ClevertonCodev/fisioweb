<?php

namespace Modules\ClinicalRecord\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Contracts\EvolutionRepositoryInterface;
use Modules\ClinicalRecord\Models\EvolutionTemplateItem;
use Modules\ClinicalRecord\Models\PatientEvolution;

class EvolutionRepository implements EvolutionRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return PatientEvolution::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->with(['clinicUser', 'template'])
            ->latest()
            ->get();
    }

    public function findForClinic(int $id, int $clinicId): PatientEvolution
    {
        return PatientEvolution::query()
            ->forClinic($clinicId)
            ->with([
                'clinicUser',
                'patient',
                'template',
                'checkedItems.item.section',
            ])
            ->findOrFail($id);
    }

    public function create(array $data): PatientEvolution
    {
        return PatientEvolution::query()->create($data);
    }

    public function update(PatientEvolution $evolution, array $data): PatientEvolution
    {
        $evolution->update($data);

        return $evolution->fresh();
    }

    public function findTemplateItems(array $checkedItemIds): Collection
    {
        return EvolutionTemplateItem::query()
            ->whereIn('id', $checkedItemIds)
            ->with('section')
            ->get()
            ->sortBy(fn ($item) => [$item->section->sort_order, $item->sort_order]);
    }

    public function replaceCheckedItems(PatientEvolution $evolution, array $checkedItemIds, array $freeTextValues): void
    {
        $evolution->checkedItems()->delete();

        $freeTextMap = [];
        foreach ($freeTextValues as $entry) {
            $freeTextMap[(int) $entry['item_id']] = $entry['value'];
        }

        foreach (array_unique($checkedItemIds) as $itemId) {
            $itemId = (int) $itemId;

            $evolution->checkedItems()->create([
                'evolution_template_item_id' => $itemId,
                'free_text_value'            => $freeTextMap[$itemId] ?? null,
            ]);
        }
    }
}
