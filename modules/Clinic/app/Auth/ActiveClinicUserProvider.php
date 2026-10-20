<?php

namespace Modules\Clinic\Auth;

use Illuminate\Auth\EloquentUserProvider;
use Illuminate\Contracts\Auth\Authenticatable;
use Modules\Clinic\Models\ClinicUser;

/**
 * Provider do guard `clinic`: o token só vale enquanto o usuário está ativo.
 * Desativar corta a sessão aberta em toda rota autenticada, inclusive no
 * refresh. O login usa retrieveByCredentials, que continua achando o inativo
 * para responder "acesso desativado" (AuthController::canLogIn).
 */
class ActiveClinicUserProvider extends EloquentUserProvider
{
    public function retrieveById($identifier): ?Authenticatable
    {
        $user = parent::retrieveById($identifier);

        if ($user instanceof ClinicUser && (int) $user->status !== ClinicUser::STATUS_ACTIVE) {
            return null;
        }

        return $user;
    }
}
