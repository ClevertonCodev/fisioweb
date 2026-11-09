<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\BaseAuthController;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\JsonResponse;
use Modules\Clinic\Contracts\MasterFirstAccessServiceInterface;
use Modules\Clinic\Http\Requests\CompleteFirstAccessRequest;
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

    public function firstAccess(CompleteFirstAccessRequest $request, MasterFirstAccessServiceInterface $firstAccess): JsonResponse
    {
        $master = $firstAccess->complete($request->string('token')->value(), $request->string('password')->value());

        return $this->respondWithToken(auth($this->guardName())->login($master));
    }

    /**
     * Usuário de clínica cancelada pelo operador, desativado pelo administrador
     * da clínica ou com e-mail ainda não confirmado não entra. Só é checado
     * após a senha correta.
     */
    protected function canLogIn(Authenticatable $user): bool
    {
        $this->blockedReasonMessage = null;

        if ($user instanceof ClinicUser && $user->belongsToCancelledClinic()) {
            $this->blockedReasonMessage = 'A clínica está cancelada. Fale com o suporte.';

            return false;
        }

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
