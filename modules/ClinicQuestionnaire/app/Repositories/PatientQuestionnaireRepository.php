<?php

namespace Modules\ClinicQuestionnaire\Repositories;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaireAnswer;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

class PatientQuestionnaireRepository implements PatientQuestionnaireRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return PatientQuestionnaire::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->whereHas('template')
            ->with(['clinic', 'clinicUser', 'template'])
            ->latest()
            ->get();
    }

    public function find(int $id): PatientQuestionnaire
    {
        $questionnaire = PatientQuestionnaire::query()
            ->with([
                'clinic',
                'clinicUser',
                'answers',
            ])
            ->findOrFail($id);

        $answeredQuestionIds = $questionnaire->answers
            ->pluck('questionnaire_question_id')
            ->map(fn ($qid) => (int) $qid)
            ->all();

        $template = QuestionnaireTemplate::withTrashed()->find($questionnaire->questionnaire_template_id);
        if (!is_null($template)) {
            $sections = $template->allSections()
                ->with([
                    'allQuestions' => function ($q) use ($answeredQuestionIds) {
                        $q->where(function ($sub) use ($answeredQuestionIds) {
                            $sub->whereNull('archived_at');
                            if (!empty($answeredQuestionIds)) {
                                $sub->orWhereIn('id', $answeredQuestionIds);
                            }
                        });
                    },
                ])
                ->where(function ($q) use ($answeredQuestionIds) {
                    $q->whereNull('archived_at');
                    if (!empty($answeredQuestionIds)) {
                        $q->orWhereHas('allQuestions', fn ($qq) => $qq->whereIn('id', $answeredQuestionIds));
                    }
                })
                ->get()
                ->each(function ($section) {
                    $section->setRelation('questions', $section->allQuestions);
                    $section->unsetRelation('allQuestions');
                });
            $template->setRelation('sections', $sections);
        }

        $questionnaire->setRelation('template', $template);

        return $questionnaire;
    }

    public function findForPublic(string $token): PatientQuestionnaire
    {
        if (!Str::isUuid($token)) {
            throw (new ModelNotFoundException)->setModel(PatientQuestionnaire::class);
        }

        return PatientQuestionnaire::query()
            ->with(['template.sections.questions'])
            ->where('public_token', $token)
            ->firstOrFail();
    }

    public function create(array $data): PatientQuestionnaire
    {
        if (empty($data['public_token'])) {
            $data['public_token'] = (string) Str::uuid();
        }

        return PatientQuestionnaire::query()->create($data);
    }

    public function update(PatientQuestionnaire $questionnaire, array $data): PatientQuestionnaire
    {
        $questionnaire->update($data);

        return $questionnaire->fresh();
    }

    public function saveAnswers(PatientQuestionnaire $questionnaire, array $answers): void
    {
        foreach ($answers as $answerDto) {
            PatientQuestionnaireAnswer::updateOrCreate(
                [
                    'patient_questionnaire_id'  => $questionnaire->id,
                    'questionnaire_question_id' => $answerDto['question_id'],
                ],
                [
                    'answer' => $answerDto['answer'],
                ],
            );
        }
    }

    public function delete(PatientQuestionnaire $questionnaire): void
    {
        $questionnaire->delete();
    }
}
