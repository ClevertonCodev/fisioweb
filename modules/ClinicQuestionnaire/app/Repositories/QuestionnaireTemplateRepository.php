<?php

namespace Modules\ClinicQuestionnaire\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateRepositoryInterface;
use Modules\ClinicQuestionnaire\Models\QuestionnaireQuestion;
use Modules\ClinicQuestionnaire\Models\QuestionnaireSection;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

class QuestionnaireTemplateRepository implements QuestionnaireTemplateRepositoryInterface
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

    public function create(array $data): QuestionnaireTemplate
    {
        return QuestionnaireTemplate::query()->create($data);
    }

    public function update(QuestionnaireTemplate $template, array $data): QuestionnaireTemplate
    {
        $template->update($data);

        return $template->fresh();
    }

    public function replaceSections(QuestionnaireTemplate $template, array $sections): void
    {
        $template->sections()->each(fn ($section) => $section->questions()->delete());
        $template->sections()->delete();

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

    public function delete(QuestionnaireTemplate $template): void
    {
        $template->sections()->each(fn ($section) => $section->questions()->delete());
        $template->sections()->delete();
        $template->delete();
    }

    public function existsActiveForClinic(int $clinicId, int $templateId): bool
    {
        return QuestionnaireTemplate::query()
            ->forClinic($clinicId)
            ->active()
            ->where('id', $templateId)
            ->exists();
    }
}
