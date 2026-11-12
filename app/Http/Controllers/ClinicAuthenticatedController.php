<?php

namespace App\Http\Controllers;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;

abstract class ClinicAuthenticatedController extends Controller
{
    /**
     * @return \Modules\Clinic\Models\ClinicUser
     */
    protected function clinicUser(): Authenticatable
    {
        $user = Auth::guard('clinic')->user();

        if (is_null($user)) {
            throw new AuthenticationException('Unauthenticated.', ['clinic']);
        }

        return $user;
    }

    protected function clinicId(): int
    {
        return (int) $this->clinicUser()->clinic_id;
    }

    protected function clinicUserId(): int
    {
        return (int) $this->clinicUser()->getAuthIdentifier();
    }

    protected function impersonatorId(): ?int
    {
        $guard = Auth::guard('clinic');

        if (is_null($guard->getToken())) {
            return null;
        }

        $operatorId = $guard->getPayload()->get('impersonated_by');

        return is_null($operatorId) ? null : (int) $operatorId;
    }

    /**
     * Troca o token desta requisição por um novo, emitido agora: serve a quem
     * acabou de trocar a própria senha e continua logado. A marca do "entrar
     * como" passa adiante para a auditoria continuar valendo.
     *
     * @return array{access_token: string, token_type: string, expires_in: int}
     */
    protected function reissueClinicToken(): array
    {
        $guard      = Auth::guard('clinic');
        $user       = $this->clinicUser();
        $operatorId = $this->impersonatorId();

        $guard->invalidate();

        return [
            'access_token' => $guard->claims(is_null($operatorId) ? [] : ['impersonated_by' => $operatorId])->login($user),
            'token_type'   => 'bearer',
            'expires_in'   => $guard->factory()->getTTL() * 60,
        ];
    }
}
