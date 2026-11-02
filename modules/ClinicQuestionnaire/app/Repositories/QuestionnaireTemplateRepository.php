<?php

namespace Modules\ClinicQuestionnaire\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateRepositoryInterface;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaireAnswer;
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
        $existingSections  = $template->allSections()->get()->keyBy('id');
        $existingQuestions = $existingSections->isNotEmpty()
            ? QuestionnaireQuestion::query()
                ->whereIn('questionnaire_section_id', $existingSections->keys())
                ->get()
                ->keyBy('id')
            : collect();

        $keptSectionIds  = [];
        $keptQuestionIds = [];

        foreach ($sections as $order => $sectionDto) {
            $sectionId    = isset($sectionDto['id']) ? (int) $sectionDto['id'] : null;
            $sectionAttrs = [
                'questionnaire_template_id' => $template->id,
                'title'                     => $sectionDto['title'],
                'sort_order'                => $sectionDto['sort_order'] ?? $order,
                'archived_at'               => null,
            ];

            if (!is_null($sectionId) && $existingSections->has($sectionId)) {
                $section = $existingSections->get($sectionId);
                $section->update($sectionAttrs);
            } else {
                $section = QuestionnaireSection::create($sectionAttrs);
            }

            $keptSectionIds[] = (int) $section->id;

            foreach ($sectionDto['questions'] ?? [] as $qOrder => $questionDto) {
                $questionId    = isset($questionDto['id']) ? (int) $questionDto['id'] : null;
                $questionAttrs = [
                    'questionnaire_section_id' => $section->id,
                    'label'                    => $questionDto['label'],
                    'type'                     => $questionDto['type'],
                    'options'                  => $questionDto['options'] ?? null,
                    'scale_min'                => $questionDto['scale_min'] ?? 0,
                    'scale_max'                => $questionDto['scale_max'] ?? 10,
                    'required'                 => $questionDto['required'] ?? false,
                    'sort_order'               => $questionDto['sort_order'] ?? $qOrder,
                    'archived_at'              => null,
                ];

                if (!is_null($questionId) && $existingQuestions->has($questionId)) {
                    $question = $existingQuestions->get($questionId);
                    $question->update($questionAttrs);
                } else {
                    $question = QuestionnaireQuestion::create($questionAttrs);
                }

                $keptQuestionIds[] = (int) $question->id;
            }
        }

        if ($existingSections->isNotEmpty()) {
            QuestionnaireQuestion::query()
                ->whereIn('questionnaire_section_id', $existingSections->keys())
                ->whereNotIn('id', $keptQuestionIds)
                ->whereNull('archived_at')
                ->update(['archived_at' => now()]);
        }

        $template->allSections()
            ->whereNotIn('id', $keptSectionIds)
            ->whereNull('archived_at')
            ->update(['archived_at' => now()]);
    }

    public function sectionIdsForTemplate(QuestionnaireTemplate $template): array
    {
        return $template->allSections()
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function questionIdsForTemplate(QuestionnaireTemplate $template): array
    {
        $sectionIds = $this->sectionIdsForTemplate($template);
        if (empty($sectionIds)) {
            return [];
        }

        return QuestionnaireQuestion::query()
            ->whereIn('questionnaire_section_id', $sectionIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    public function delete(QuestionnaireTemplate $template): void
    {
        if ($this->hasQuestionnairesOrAnswers($template)) {
            $template->delete();

            return;
        }

        $sectionIds = $this->sectionIdsForTemplate($template);
        if (!empty($sectionIds)) {
            QuestionnaireQuestion::query()
                ->whereIn('questionnaire_section_id', $sectionIds)
                ->delete();
        }
        $template->allSections()->delete();
        $template->forceDelete();
    }

    private function hasQuestionnairesOrAnswers(QuestionnaireTemplate $template): bool
    {
        if (
            PatientQuestionnaire::withTrashed()
                ->where('questionnaire_template_id', $template->id)
                ->exists()
        ) {
            return true;
        }

        $questionIds = $this->questionIdsForTemplate($template);
        if (empty($questionIds)) {
            return false;
        }

        return PatientQuestionnaireAnswer::query()
            ->whereIn('questionnaire_question_id', $questionIds)
            ->exists();
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
