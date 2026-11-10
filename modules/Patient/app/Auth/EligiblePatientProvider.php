<?php

namespace Modules\Patient\Auth;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Hashing\Hasher;
use Modules\Patient\Models\Patient;
use Modules\Patient\Services\PatientAuthService;

/**
 * O login usa retrieveByCredentials, que continua achando o paciente inelegível
 * para o AuthController recusar com 401.
 */
class EligiblePatientProvider extends EloquentUserProvider
{
    public function __construct(
        Hasher $hasher,
        string $model,
        private readonly PatientAuthService $authService,
    ) {
        parent::__construct($hasher, $model);
    }

    public function retrieveById($identifier): ?Authenticatable
    {
        $patient = parent::retrieveById($identifier);

        if ($patient instanceof Patient && !$this->authService->isEligible($patient)) {
            return null;
        }

        return $patient;
    }
}
