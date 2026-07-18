<?php

namespace Modules\ClinicQuestionnaire\Contracts;

use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;

interface PatientQuestionnaireServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId);

    public function find(int $id): PatientQuestionnaire;

    public function findForPatient(int $clinicId, int $patientId, int $questionnaireId): ?PatientQuestionnaire;

    public function send(int $clinicId, int $patientId, int $clinicUserId, array $data): PatientQuestionnaire;

    public function answer(PatientQuestionnaire $questionnaire, array $answers): PatientQuestionnaire;

    /**
     * Responde questionário presencial pela clínica (auth clinic).
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Illuminate\Validation\ValidationException
     */
    public function answerForClinicPatient(int $clinicId, int $patientId, int $questionnaireId, array $answers): PatientQuestionnaire;

    public function destroy(PatientQuestionnaire $questionnaire): void;

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    public function showForPublic(int $id): PatientQuestionnaire;

    /**
     * @throws \Illuminate\Validation\ValidationException
     */
    public function submitPublicAnswer(int $id, array $answers): PatientQuestionnaire;
}
