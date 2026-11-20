<?php

namespace Modules\ClinicQuestionnaire\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireServiceInterface;
use Modules\ClinicQuestionnaire\Enums\QuestionnaireUnavailableReason;
use Modules\ClinicQuestionnaire\Events\QuestionnaireAnswered;
use Modules\ClinicQuestionnaire\Events\QuestionnaireCancelled;
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\ClinicQuestionnaire\Events\QuestionnaireExpired;
use Modules\ClinicQuestionnaire\Events\QuestionnaireSent;
use Modules\ClinicQuestionnaire\Exceptions\QuestionnaireUnavailableException;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Support\QuestionnaireShareUrl;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;

class PatientQuestionnaireService implements PatientQuestionnaireServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected PatientQuestionnaireRepositoryInterface $repository,
        protected PatientContactReadServiceInterface $patientContacts,
    ) {}

    public function listByPatient(int $clinicId, int $patientId)
    {
        return $this->repository->listByPatient($clinicId, $patientId)
            ->map(fn (PatientQuestionnaire $questionnaire) => $this->withShareUrl($questionnaire));
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

        return $this->withShareUrl($questionnaire);
    }

    public function requestEmail(PatientQuestionnaire $questionnaire, ?int $actorId): void
    {
        if ($questionnaire->status !== PatientQuestionnaire::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'questionnaire' => 'Este questionário não está pendente.',
            ]);
        }

        if (!is_null($questionnaire->expires_at) && $questionnaire->expires_at->isPast()) {
            throw ValidationException::withMessages([
                'questionnaire' => 'Este questionário expirou.',
            ]);
        }

        $patient = $this->patientContacts->findById(
            (int) $questionnaire->clinic_id,
            (int) $questionnaire->patient_id,
        );

        if (is_null($patient) || empty($patient->email) || !filter_var($patient->email, FILTER_VALIDATE_EMAIL)) {
            throw ValidationException::withMessages([
                'email' => 'Paciente sem e-mail cadastrado.',
            ]);
        }

        $this->dispatchEvent(new QuestionnaireEmailRequested(
            version: self::EVENT_VERSION,
            clinicId: (int) $questionnaire->clinic_id,
            patientQuestionnaireId: (int) $questionnaire->id,
            patientId: (int) $questionnaire->patient_id,
            actorId: $actorId,
            occurredAt: CarbonImmutable::now(),
        ));
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

            return $this->withShareUrl($questionnaire);
        });
    }

    public function answer(PatientQuestionnaire $questionnaire, array $answers): PatientQuestionnaire
    {
        $this->ensureQuestionsBelongToTemplate($questionnaire, $answers);

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

    public function answerForClinicPatient(int $clinicId, int $patientId, int $questionnaireId, array $answers): PatientQuestionnaire
    {
        $questionnaire = $this->findForPatient($clinicId, $patientId, $questionnaireId);

        if (is_null($questionnaire)) {
            throw (new \Illuminate\Database\Eloquent\ModelNotFoundException)->setModel(PatientQuestionnaire::class, [$questionnaireId]);
        }

        if ((string) $questionnaire->modality !== 'presencial') {
            throw ValidationException::withMessages([
                'modality' => ['Somente questionários presenciais podem ser respondidos pela clínica.'],
            ]);
        }

        $this->ensurePendingAndNotExpired($questionnaire);

        return $this->answer($questionnaire, $answers);
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

    public function showForPublic(string $token): PatientQuestionnaire
    {
        $questionnaire = $this->repository->findForPublic($token);

        return $this->presentForPublic($this->ensurePendingAndNotExpired($questionnaire));
    }

    public function submitPublicAnswer(string $token, array $answers): PatientQuestionnaire
    {
        $questionnaire = $this->repository->findForPublic($token);
        $this->ensurePendingAndNotExpired($questionnaire);

        return $this->presentForPublic($this->answer($questionnaire, $answers));
    }

    private function withShareUrl(PatientQuestionnaire $questionnaire): PatientQuestionnaire
    {
        $questionnaire->loadMissing('clinic');
        $slug  = $questionnaire->clinic?->slug;
        $token = $questionnaire->public_token;

        $shareUrl = QuestionnaireShareUrl::from(
            is_null($slug) ? null : (string) $slug,
            is_null($token) ? null : (string) $token,
        );

        $questionnaire->unsetRelation('clinic');
        $questionnaire->setAttribute('share_url', $shareUrl);
        $questionnaire->syncOriginalAttribute('share_url');

        return $questionnaire;
    }

    private function presentForPublic(PatientQuestionnaire $questionnaire): PatientQuestionnaire
    {
        $questionnaire->loadMissing('clinic');
        $questionnaire->setAttribute('clinic_name', $questionnaire->clinic?->name);
        $questionnaire->syncOriginalAttribute('clinic_name');

        $questionnaire->unsetRelation('clinicUser');
        $questionnaire->unsetRelation('clinic');
        $questionnaire->makeHidden(['clinic_user_id']);

        return $questionnaire;
    }

    private function ensurePendingAndNotExpired(PatientQuestionnaire $questionnaire): PatientQuestionnaire
    {
        if ($questionnaire->status === PatientQuestionnaire::STATUS_ANSWERED) {
            throw QuestionnaireUnavailableException::because(
                QuestionnaireUnavailableReason::Answered,
                'Este questionário já foi respondido.',
            );
        }

        if ($questionnaire->status !== PatientQuestionnaire::STATUS_PENDING) {
            throw $this->expiredException();
        }

        if (!is_null($questionnaire->expires_at) && $questionnaire->expires_at->isPast()) {
            $this->markExpired($questionnaire);

            throw $this->expiredException();
        }

        return $questionnaire;
    }

    private function expiredException(): QuestionnaireUnavailableException
    {
        return QuestionnaireUnavailableException::because(
            QuestionnaireUnavailableReason::Expired,
            'Este questionário expirou.',
        );
    }

    /**
     * @param  array<int, array{question_id: int|string, answer: mixed}>  $answers
     *
     * @throws ValidationException
     */
    private function ensureQuestionsBelongToTemplate(PatientQuestionnaire $questionnaire, array $answers): void
    {
        $validQuestionIds = array_flip($this->repository->questionIdsForTemplate((int) $questionnaire->questionnaire_template_id));
        $errors           = [];

        foreach ($answers as $index => $answer) {
            if (!isset($validQuestionIds[(int) $answer['question_id']])) {
                $errors["answers.{$index}.question_id"] = 'A pergunta informada não pertence a este questionário.';
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
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
