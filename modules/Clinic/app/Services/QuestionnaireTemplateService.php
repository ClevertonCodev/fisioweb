<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Models\QuestionnaireQuestion;
use Modules\Clinic\Models\QuestionnaireSection;
use Modules\Clinic\Models\QuestionnaireTemplate;

class QuestionnaireTemplateService
{
    public function listForClinic(int $clinicId): Collection
    {
        return QuestionnaireTemplate::query()
            ->forClinic($clinicId)
            ->active()
            ->with('sections.questions')
            ->latest()
            ->get();
    }

    public function find(int $id): QuestionnaireTemplate
    {
        return QuestionnaireTemplate::query()
            ->with('sections.questions')
            ->findOrFail($id);
    }

    public function create(array $dto, int $clinicId): QuestionnaireTemplate
    {
        return DB::transaction(function () use ($dto, $clinicId) {
            $template = QuestionnaireTemplate::create([
                'clinic_id'   => $clinicId,
                'title'       => $dto['title'],
                'description' => $dto['description'] ?? null,
                'is_active'   => true,
            ]);

            $this->syncSections($template, $dto['sections'] ?? []);

            return $this->find($template->id);
        });
    }

    public function update(QuestionnaireTemplate $template, array $dto): QuestionnaireTemplate
    {
        return DB::transaction(function () use ($template, $dto) {
            $template->update([
                'title'       => $dto['title'] ?? $template->title,
                'description' => array_key_exists('description', $dto) ? $dto['description'] : $template->description,
            ]);

            if (isset($dto['sections'])) {
                $template->sections()->each(fn ($s) => $s->questions()->delete());
                $template->sections()->delete();
                $this->syncSections($template, $dto['sections']);
            }

            return $this->find($template->id);
        });
    }

    public function destroy(QuestionnaireTemplate $template): void
    {
        $template->delete();
    }

    private function syncSections(QuestionnaireTemplate $template, array $sections): void
    {
        foreach ($sections as $order => $sectionDto) {
            $section = QuestionnaireSection::create([
                'questionnaire_template_id' => $template->id,
                'title'                     => $sectionDto['title'],
                'sort_order'                => $sectionDto['sort_order'] ?? $order,
            ]);

            foreach ($sectionDto['questions'] ?? [] as $qOrder => $questionDto) {
                QuestionnaireQuestion::create([
                    'questionnaire_section_id' => $section->id,
                    'label'                    => $questionDto['label'],
                    'type'                     => $questionDto['type'],
                    'options'                  => $questionDto['options'] ?? null,
                    'scale_min'                => $questionDto['scale_min'] ?? 0,
                    'scale_max'                => $questionDto['scale_max'] ?? 10,
                    'required'                 => $questionDto['required'] ?? false,
                    'sort_order'               => $questionDto['sort_order'] ?? $qOrder,
                ]);
            }
        }
    }
}
