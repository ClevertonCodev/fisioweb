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
 *
 * A busca por e-mail ignora maiúsculas: o auto-cadastro grava em minúsculas e
 * o admin grava como foi digitado, e no Postgres `=` diferencia as duas.
 * Vale para o login e para o broker de senha, que usam este provider.
 */
class ActiveClinicUserProvider extends EloquentUserProvider
{
    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        $email = $credentials['email'] ?? null;

        if (!is_string($email)) {
            return parent::retrieveByCredentials($credentials);
        }

        return $this->newModelQuery()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower(trim($email))])
            ->orderBy('id')
            ->first();
    }

    public function retrieveById($identifier): ?Authenticatable
    {
        $user = parent::retrieveById($identifier);

        if ($user instanceof ClinicUser && (int) $user->status !== ClinicUser::STATUS_ACTIVE) {
            return null;
        }

        return $user;
    }
}
