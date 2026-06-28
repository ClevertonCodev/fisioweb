<?php

namespace Modules\ClinicQuestionnaire\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaireAnswer;

class PatientQuestionnaireRepository implements PatientQuestionnaireRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return PatientQuestionnaire::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->whereHas('template')
            ->with(['clinicUser', 'template'])
            ->latest()
            ->get();
    }

    public function find(int $id): PatientQuestionnaire
    {
        return PatientQuestionnaire::query()
            ->with([
                'clinicUser',
                'template' => fn ($q) => $q->withTrashed()->with('sections.questions'),
                'answers',
            ])
            ->findOrFail($id);
    }

    public function findForPublic(int $id): PatientQuestionnaire
    {
        return PatientQuestionnaire::query()
            ->with(['template.sections.questions'])
            ->findOrFail($id);
    }

    public function create(array $data): PatientQuestionnaire
    {
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
