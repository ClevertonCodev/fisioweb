<?php

namespace Modules\ClinicalRecord\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicalRecord\Contracts\EvolutionRepositoryInterface;
use Modules\ClinicalRecord\Contracts\EvolutionServiceInterface;
use Modules\ClinicalRecord\Events\EvolutionRecorded;
use Modules\ClinicalRecord\Models\PatientEvolution;

class EvolutionService implements EvolutionServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected EvolutionRepositoryInterface $repository,
    ) {}

    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return $this->repository->listByPatient($clinicId, $patientId);
    }

    public function findForClinic(int $id, int $clinicId): PatientEvolution
    {
        return $this->repository->findForClinic($id, $clinicId);
    }

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): PatientEvolution
    {
        return DB::transaction(function () use ($dto, $clinicId, $patientId, $clinicUserId) {
            $checkedItemIds = $dto['checked_item_ids'] ?? [];
            $freeTextValues = $dto['free_text_values'] ?? [];
            $generatedText  = $dto['generated_text'] ?? null;

            if (empty($generatedText) && count($checkedItemIds) > 0) {
                $generatedText = $this->generateText($checkedItemIds, $freeTextValues);
            }

            $evolution = $this->repository->create([
                'clinic_id'             => $clinicId,
                'patient_id'            => $patientId,
                'clinic_user_id'        => $clinicUserId,
                'evolution_template_id' => $dto['evolution_template_id'] ?? null,
                'title'                 => $dto['title'],
                'generated_text'        => $generatedText,
                'notes'                 => $dto['notes'] ?? null,
                'status'                => PatientEvolution::STATUS_DRAFT,
            ]);

            $this->repository->replaceCheckedItems($evolution, $checkedItemIds, $freeTextValues);
            $evolution = $this->findForClinic($evolution->id, $clinicId);

            $this->dispatchEvent(new EvolutionRecorded(...$this->eventPayload($evolution, (string) $evolution->created_at?->toIso8601String())));

            return $evolution;
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

            if (!is_null($checkedItemIds)) {
                if (empty($generatedText) && count($checkedItemIds) > 0) {
                    $generatedText = $this->generateText($checkedItemIds, $freeTextValues);
                }

                $this->repository->replaceCheckedItems($evolution, $checkedItemIds, $freeTextValues);
            }

            $evolution = $this->repository->update($evolution, [
                'title'          => $dto['title'] ?? $evolution->title,
                'generated_text' => $generatedText ?? $evolution->generated_text,
                'notes'          => array_key_exists('notes', $dto) ? $dto['notes'] : $evolution->notes,
            ]);

            $evolution = $this->findForClinic($evolution->id, $evolution->clinic_id);
            $this->dispatchEvent(new EvolutionRecorded(...$this->eventPayload($evolution, (string) $evolution->updated_at?->toIso8601String())));

            return $evolution;
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

        $items   = $this->repository->findTemplateItems($checkedItemIds);
        $grouped = $items->groupBy(fn ($item) => $item->section->title);
        $parts   = [];

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

        $evolution = $this->findForClinic($evolution->id, $evolution->clinic_id);
        $this->dispatchEvent(new EvolutionRecorded(...$this->eventPayload($evolution, (string) $evolution->signed_at?->toIso8601String())));

        return $evolution;
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

    private function eventPayload(PatientEvolution $evolution, string $recordedAt): array
    {
        return [
            self::EVENT_VERSION,
            (int) $evolution->id,
            (int) $evolution->clinic_id,
            (int) $evolution->patient_id,
            !is_null($evolution->clinic_user_id) ? (int) $evolution->clinic_user_id : null,
            Auth::guard('clinic')->id(),
            !is_null($evolution->evolution_template_id) ? (int) $evolution->evolution_template_id : null,
            $recordedAt,
            CarbonImmutable::now(),
        ];
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
