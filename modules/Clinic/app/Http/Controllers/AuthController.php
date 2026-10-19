<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Http\Requests\LoginRequest;
use Modules\Clinic\Models\ClinicUser;

class AuthController extends BaseAuthController
{
    protected function guardName(): string
    {
        return 'clinic';
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->attemptLogin($request->validated());
    }

    /** Usuário desativado pelo administrador da clínica não entra. */
    protected function canLogIn(Authenticatable $user): bool
    {
        return $user instanceof ClinicUser
            && (int) $user->status === ClinicUser::STATUS_ACTIVE;
    }

    protected function blockedLoginMessage(): string
    {
        return 'Seu acesso está desativado. Fale com o administrador da clínica.';
    }
}
