<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Http\Requests\LoginRequest;
use Modules\Clinic\Models\ClinicUser;

class AuthController extends BaseAuthController
{
    private ?string $blockedReasonMessage = null;

    protected function guardName(): string
    {
        return 'clinic';
    }

    public function login(LoginRequest $request): JsonResponse
    {
        return $this->attemptLogin($request->validated());
    }

    /**
     * Usuário desativado pelo administrador da clínica ou com e-mail ainda
     * não confirmado não entra. Só é checado após a senha correta.
     */
    protected function canLogIn(Authenticatable $user): bool
    {
        $this->blockedReasonMessage = null;

        if (!$user instanceof ClinicUser || (int) $user->status !== ClinicUser::STATUS_ACTIVE) {
            $this->blockedReasonMessage = 'Seu acesso está desativado. Fale com o administrador da clínica.';

            return false;
        }

        if (is_null($user->email_verified_at)) {
            $this->blockedReasonMessage = "Confirme seu e-mail para entrar. Enviamos o link para {$user->email}.";

            return false;
        }

        return true;
    }

    protected function blockedLoginMessage(): string
    {
        return $this->blockedReasonMessage ?? 'Seu acesso está desativado. Fale com o administrador da clínica.';
    }
}
