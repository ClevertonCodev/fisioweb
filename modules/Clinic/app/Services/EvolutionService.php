<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Clinic\Contracts\EvolutionServiceInterface;
use Modules\Clinic\Models\EvolutionTemplateItem;
use Modules\Clinic\Models\PatientEvolution;

class EvolutionService implements EvolutionServiceInterface
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

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): PatientEvolution
    {
        return DB::transaction(function () use ($dto, $clinicId, $patientId, $clinicUserId) {
            $checkedItemIds  = $dto['checked_item_ids'] ?? [];
            $freeTextValues  = $dto['free_text_values'] ?? [];
            $generatedText   = $dto['generated_text'] ?? null;

            if (!$generatedText && count($checkedItemIds) > 0) {
                $generatedText = $this->generateText($checkedItemIds, $freeTextValues);
            }

            $evolution = PatientEvolution::query()->create([
                'clinic_id'             => $clinicId,
                'patient_id'            => $patientId,
                'clinic_user_id'        => $clinicUserId,
                'evolution_template_id' => $dto['evolution_template_id'] ?? null,
                'title'                 => $dto['title'],
                'generated_text'        => $generatedText,
                'notes'                 => $dto['notes'] ?? null,
                'status'                => PatientEvolution::STATUS_DRAFT,
            ]);

            $this->syncCheckedItems($evolution, $checkedItemIds, $freeTextValues);

            return $this->findForClinic($evolution->id, $clinicId);
        });
    }

    public function update(PatientEvolution $evolution, array $dto): PatientEvolution
    {
        if ($evolution->status !== PatientEvolution::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => ['Somente evoluções em rascunho podem ser editadas.'],
            ]);
        }

        return DB::transaction(function () use ($evolution, $dto) {
            $checkedItemIds = $dto['checked_item_ids'] ?? null;
            $freeTextValues = $dto['free_text_values'] ?? [];
            $generatedText  = $dto['generated_text'] ?? null;

            if ($checkedItemIds !== null) {
                if (!$generatedText && count($checkedItemIds) > 0) {
                    $generatedText = $this->generateText($checkedItemIds, $freeTextValues);
                }
                $this->syncCheckedItems($evolution, $checkedItemIds, $freeTextValues);
            }

            $evolution->update([
                'title'          => $dto['title'] ?? $evolution->title,
                'generated_text' => $generatedText ?? $evolution->generated_text,
                'notes'          => array_key_exists('notes', $dto) ? $dto['notes'] : $evolution->notes,
            ]);

            return $this->findForClinic($evolution->id, $evolution->clinic_id);
        });
    }

    public function generateText(array $checkedItemIds, array $freeTextValues): string
    {
        if (empty($checkedItemIds)) {
            return '';
        }

        $freeTextMap = [];
        foreach ($freeTextValues as $entry) {
            $freeTextMap[(int) $entry['item_id']] = $entry['value'];
        }

        $items = EvolutionTemplateItem::query()
            ->whereIn('id', $checkedItemIds)
            ->with('section')
            ->get()
            ->sortBy(fn ($item) => [$item->section->sort_order, $item->sort_order]);

        $grouped = $items->groupBy(fn ($item) => $item->section->title);

        $parts = [];

        foreach ($grouped as $sectionTitle => $sectionItems) {
            $lines = ["**{$sectionTitle}:**"];

            foreach ($sectionItems as $item) {
                $text = $item->print_text;

                if ($item->has_free_text && isset($freeTextMap[$item->id])) {
                    $text .= ' — ' . $freeTextMap[$item->id];
                }

                $lines[] = $text;
            }

            $parts[] = implode("\n", $lines);
        }

        return implode("\n\n", $parts);
    }

    public function sign(PatientEvolution $evolution, int $clinicUserId): PatientEvolution
    {
        if ($evolution->status === PatientEvolution::STATUS_SIGNED) {
            throw ValidationException::withMessages([
                'status' => ['Esta evolução já está assinada.'],
            ]);
        }

        $evolution->update([
            'status'         => PatientEvolution::STATUS_SIGNED,
            'signed_at'      => now(),
            'clinic_user_id' => $clinicUserId,
        ]);

        return $this->findForClinic($evolution->id, $evolution->clinic_id);
    }

    public function destroy(PatientEvolution $evolution): void
    {
        if ($evolution->status !== PatientEvolution::STATUS_DRAFT) {
            throw ValidationException::withMessages([
                'status' => ['Somente evoluções em rascunho podem ser excluídas.'],
            ]);
        }

        $evolution->delete();
    }

    private function syncCheckedItems(PatientEvolution $evolution, array $checkedItemIds, array $freeTextValues): void
    {
        $evolution->checkedItems()->delete();

        $freeTextMap = [];
        foreach ($freeTextValues as $entry) {
            $freeTextMap[(int) $entry['item_id']] = $entry['value'];
        }

        foreach (array_unique($checkedItemIds) as $itemId) {
            $evolution->checkedItems()->create([
                'evolution_template_item_id' => $itemId,
                'free_text_value'            => $freeTextMap[$itemId] ?? null,
            ]);
        }
    }
}
