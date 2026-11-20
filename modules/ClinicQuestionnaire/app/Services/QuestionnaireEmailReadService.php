<?php

namespace Modules\ClinicQuestionnaire\Services;

use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\Public\QuestionnaireEmailReadServiceInterface;
use Modules\ClinicQuestionnaire\Data\Public\QuestionnaireEmailDTO;
use Modules\ClinicQuestionnaire\Support\QuestionnaireShareUrl;

class QuestionnaireEmailReadService implements QuestionnaireEmailReadServiceInterface
{
    public function __construct(
        protected PatientQuestionnaireRepositoryInterface $repository,
    ) {}

    public function findForEmail(int $clinicId, int $patientQuestionnaireId): ?QuestionnaireEmailDTO
    {
        $questionnaire = $this->repository->findForClinicWithEmailDetails($clinicId, $patientQuestionnaireId);

        if (is_null($questionnaire)) {
            return null;
        }

        $questionsCount = 0;
        foreach ($questionnaire->template?->sections ?? [] as $section) {
            $questionsCount += $section->questions->count();
        }

        return new QuestionnaireEmailDTO(
            id: (int) $questionnaire->id,
            clinicId: (int) $questionnaire->clinic_id,
            patientId: (int) $questionnaire->patient_id,
            title: (string) ($questionnaire->template?->title ?? ''),
            questionsCount: $questionsCount,
            expiresAt: $questionnaire->expires_at?->toIso8601String(),
            status: (string) $questionnaire->status,
            shareUrl: QuestionnaireShareUrl::from(
                $questionnaire->clinic?->slug,
                $questionnaire->public_token,
            ),
        );
    }
}
