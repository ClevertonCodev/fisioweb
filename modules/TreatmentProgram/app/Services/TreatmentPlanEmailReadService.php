<?php

namespace Modules\TreatmentProgram\Services;

use Modules\TreatmentProgram\Contracts\Public\TreatmentPlanEmailReadServiceInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanRepositoryInterface;
use Modules\TreatmentProgram\Data\Public\TreatmentPlanEmailDTO;

class TreatmentPlanEmailReadService implements TreatmentPlanEmailReadServiceInterface
{
    public function __construct(
        protected TreatmentPlanRepositoryInterface $repository,
        protected ProgramPdfViewModelBuilder $viewModelBuilder,
    ) {}

    public function findForEmail(int $clinicId, int $treatmentPlanId): ?TreatmentPlanEmailDTO
    {
        $plan = $this->repository->findForClinicWithEmailDetails($clinicId, $treatmentPlanId);

        if (is_null($plan)) {
            return null;
        }

        $message = is_null($plan->message) ? null : trim((string) $plan->message);

        return new TreatmentPlanEmailDTO(
            id: (int) $plan->id,
            clinicId: (int) $plan->clinic_id,
            patientId: is_null($plan->patient_id) ? null : (int) $plan->patient_id,
            professionalId: is_null($plan->clinic_user_id) ? null : (int) $plan->clinic_user_id,
            title: (string) $plan->title,
            message: empty($message) ? null : $message,
            startDate: $plan->start_date?->toDateString(),
            endDate: $plan->end_date?->toDateString(),
            exercisesCount: (int) ($plan->exercises_count ?? 0),
            status: (string) $plan->status,
            shareUrl: $this->viewModelBuilder->deepLinkUrl($plan),
        );
    }
}
