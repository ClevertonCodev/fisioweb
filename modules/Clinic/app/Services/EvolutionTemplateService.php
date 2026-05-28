<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\Clinic\Contracts\EvolutionTemplateServiceInterface;
use Modules\Clinic\Models\EvolutionTemplate;

class EvolutionTemplateService implements EvolutionTemplateServiceInterface
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

    public function create(array $dto, int $clinicId): EvolutionTemplate
    {
        return DB::transaction(function () use ($dto, $clinicId) {
            $template = EvolutionTemplate::query()->create([
                'clinic_id'   => $clinicId,
                'name'        => $dto['name'],
                'description' => $dto['description'] ?? null,
                'is_system'   => false,
                'is_active'   => true,
            ]);

            $this->syncSections($template, $dto['sections'] ?? []);

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
            $template->update([
                'name'        => $dto['name'] ?? $template->name,
                'description' => array_key_exists('description', $dto) ? $dto['description'] : $template->description,
            ]);

            if (isset($dto['sections'])) {
                $template->sections()->each(fn ($s) => $s->items()->delete());
                $template->sections()->delete();
                $this->syncSections($template, $dto['sections']);
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

        $hasEvolutions = $template->hasMany(\Modules\Clinic\Models\PatientEvolution::class, 'evolution_template_id')
            ->exists();

        if ($hasEvolutions) {
            throw ValidationException::withMessages([
                'template' => ['Este template possui evoluções vinculadas e não pode ser removido.'],
            ]);
        }

        $template->sections()->each(fn ($s) => $s->items()->delete());
        $template->sections()->delete();
        $template->delete();
    }

    private function syncSections(EvolutionTemplate $template, array $sections): void
    {
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
}
