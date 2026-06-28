<?php

namespace Modules\ClinicQuestionnaire\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireServiceInterface;
use Modules\ClinicQuestionnaire\Events\QuestionnaireAnswered;
use Modules\ClinicQuestionnaire\Events\QuestionnaireCancelled;
use Modules\ClinicQuestionnaire\Events\QuestionnaireExpired;
use Modules\ClinicQuestionnaire\Events\QuestionnaireSent;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;

class PatientQuestionnaireService implements PatientQuestionnaireServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected PatientQuestionnaireRepositoryInterface $repository,
    ) {}

    public function listByPatient(int $clinicId, int $patientId)
    {
        return $this->repository->listByPatient($clinicId, $patientId);
    }

    public function find(int $id): PatientQuestionnaire
    {
        return $this->repository->find($id);
    }

    public function findForPatient(int $clinicId, int $patientId, int $questionnaireId): ?PatientQuestionnaire
    {
        $questionnaire = $this->repository->find($questionnaireId);

        if (
            (int) $questionnaire->clinic_id !== $clinicId
            || (int) $questionnaire->patient_id !== $patientId
        ) {
            return null;
        }

        return $questionnaire;
    }

    public function send(int $clinicId, int $patientId, int $clinicUserId, array $data): PatientQuestionnaire
    {
        return DB::transaction(function () use ($clinicId, $patientId, $clinicUserId, $data) {
            $questionnaire = $this->repository->create([
                'clinic_id'                 => $clinicId,
                'patient_id'                => $patientId,
                'clinic_user_id'            => $clinicUserId,
                'questionnaire_template_id' => $data['questionnaire_template_id'],
                'modality'                  => $data['modality'],
                'status'                    => PatientQuestionnaire::STATUS_PENDING,
                'expires_at'                => $data['expires_at'] ?? null,
            ]);

            $questionnaire = $this->find($questionnaire->id);

            $expiresAt = !is_null($questionnaire->expires_at)
                ? CarbonImmutable::parse($questionnaire->expires_at)
                : null;

            $this->dispatchEvent(new QuestionnaireSent(
                self::EVENT_VERSION,
                (int) $questionnaire->id,
                (int) $questionnaire->clinic_id,
                (int) $questionnaire->patient_id,
                !is_null($questionnaire->clinic_user_id) ? (int) $questionnaire->clinic_user_id : null,
                (int) $questionnaire->questionnaire_template_id,
                (string) $questionnaire->modality,
                (string) $questionnaire->status,
                $expiresAt,
                CarbonImmutable::now(),
            ));

            return $questionnaire;
        });
    }

    public function answer(PatientQuestionnaire $questionnaire, array $answers): PatientQuestionnaire
    {
        return DB::transaction(function () use ($questionnaire, $answers) {
            $this->repository->saveAnswers($questionnaire, $answers);

            $answeredAt = CarbonImmutable::now();

            $questionnaire = $this->repository->update($questionnaire, [
                'status'      => PatientQuestionnaire::STATUS_ANSWERED,
                'answered_at' => $answeredAt,
            ]);

            $questionnaire = $this->find($questionnaire->id);

            $this->dispatchEvent(new QuestionnaireAnswered(
                self::EVENT_VERSION,
                (int) $questionnaire->id,
                (int) $questionnaire->clinic_id,
                (int) $questionnaire->patient_id,
                (int) $questionnaire->questionnaire_template_id,
                (string) $questionnaire->status,
                $answeredAt,
                CarbonImmutable::now(),
            ));

            return $questionnaire;
        });
    }

    public function destroy(PatientQuestionnaire $questionnaire): void
    {
        DB::transaction(function () use ($questionnaire) {
            $status = (string) $questionnaire->status;

            $this->repository->delete($questionnaire);

            $this->dispatchEvent(new QuestionnaireCancelled(
                self::EVENT_VERSION,
                (int) $questionnaire->id,
                (int) $questionnaire->clinic_id,
                (int) $questionnaire->patient_id,
                $status,
                CarbonImmutable::now(),
            ));
        });
    }

    public function showForPublic(int $id): PatientQuestionnaire
    {
        $questionnaire = $this->repository->findForPublic($id);

        return $this->ensurePendingAndNotExpired($questionnaire);
    }

    public function submitPublicAnswer(int $id, array $answers): PatientQuestionnaire
    {
        $questionnaire = $this->repository->findForPublic($id);
        $this->ensurePendingAndNotExpired($questionnaire);

        return $this->answer($questionnaire, $answers);
    }

    private function ensurePendingAndNotExpired(PatientQuestionnaire $questionnaire): PatientQuestionnaire
    {
        if ($questionnaire->status !== PatientQuestionnaire::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'questionnaire' => ['Este questionário já foi respondido ou expirou.'],
            ]);
        }

        if (!is_null($questionnaire->expires_at) && $questionnaire->expires_at->isPast()) {
            $this->markExpired($questionnaire);

            throw ValidationException::withMessages([
                'questionnaire' => ['Este questionário expirou.'],
            ]);
        }

        return $questionnaire;
    }

    private function markExpired(PatientQuestionnaire $questionnaire): void
    {
        DB::transaction(function () use ($questionnaire) {
            if ($questionnaire->status === PatientQuestionnaire::STATUS_EXPIRED) {
                return;
            }

            $this->repository->update($questionnaire, [
                'status' => PatientQuestionnaire::STATUS_EXPIRED,
            ]);

            $this->dispatchEvent(new QuestionnaireExpired(
                self::EVENT_VERSION,
                (int) $questionnaire->id,
                (int) $questionnaire->clinic_id,
                (int) $questionnaire->patient_id,
                PatientQuestionnaire::STATUS_EXPIRED,
                CarbonImmutable::now(),
            ));
        });
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
