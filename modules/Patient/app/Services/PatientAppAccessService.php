<?php

namespace Modules\Patient\Services;

use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\Public\PatientAppAccessInterface;

class PatientAppAccessService implements PatientAppAccessInterface
{
    public function __construct(
        protected PatientRepositoryInterface $repository,
        protected PatientAuthService $authService,
    ) {}

    public function allowsAppAccess(int $patientId): bool
    {
        $patient = $this->repository->find($patientId);

        return !is_null($patient) && $this->authService->isEligible($patient);
    }
}
