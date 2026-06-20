<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Models\PatientQuestionnaire;
use Modules\Clinic\Models\PatientQuestionnaireAnswer;

class PatientQuestionnaireService
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

    public function send(int $clinicId, int $patientId, int $clinicUserId, array $data): PatientQuestionnaire
    {
        $questionnaire = PatientQuestionnaire::create([
            'clinic_id'                  => $clinicId,
            'patient_id'                 => $patientId,
            'clinic_user_id'             => $clinicUserId,
            'questionnaire_template_id'  => $data['questionnaire_template_id'],
            'modality'                   => $data['modality'],
            'status'                     => PatientQuestionnaire::STATUS_PENDING,
            'expires_at'                 => $data['expires_at'] ?? null,
        ]);

        return $this->find($questionnaire->id);
    }

    public function answer(PatientQuestionnaire $questionnaire, array $answers): PatientQuestionnaire
    {
        return DB::transaction(function () use ($questionnaire, $answers) {
            foreach ($answers as $answerDto) {
                PatientQuestionnaireAnswer::updateOrCreate(
                    [
                        'patient_questionnaire_id'   => $questionnaire->id,
                        'questionnaire_question_id'  => $answerDto['question_id'],
                    ],
                    [
                        'answer' => $answerDto['answer'],
                    ]
                );
            }

            $questionnaire->update([
                'status'      => PatientQuestionnaire::STATUS_ANSWERED,
                'answered_at' => now(),
            ]);

            return $this->find($questionnaire->id);
        });
    }

    public function destroy(PatientQuestionnaire $questionnaire): void
    {
        $questionnaire->delete();
    }
}
