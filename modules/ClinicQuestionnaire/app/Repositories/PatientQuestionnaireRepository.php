<?php

namespace Modules\ClinicQuestionnaire\Repositories;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
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
            ->with(['clinic', 'clinicUser', 'template'])
            ->latest()
            ->get();
    }

    public function find(int $id): PatientQuestionnaire
    {
        return PatientQuestionnaire::query()
            ->with([
                'clinic',
                'clinicUser',
                'template' => fn ($q) => $q->withTrashed()->with('sections.questions'),
                'answers',
            ])
            ->findOrFail($id);
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
