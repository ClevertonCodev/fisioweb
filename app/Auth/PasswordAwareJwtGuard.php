<?php

namespace App\Auth;

use App\Contracts\RevokesTokensOnPasswordChange;
use PHPOpenSourceSaver\JWTAuth\JWTGuard;

/**
 * Guard JWT que recusa o token emitido antes da última troca de senha. O
 * refresh fica dentro do `auth:<guard>`, então cai junto.
 */
class PasswordAwareJwtGuard extends JWTGuard
{
    public function user()
    {
        if (!is_null($this->user)) {
            return $this->user;
        }

        $user = parent::user();

        if ($user instanceof RevokesTokensOnPasswordChange
            && $user->tokenIssuedBeforePasswordChange((int) $this->jwt->getPayload()->get('iat'))) {
            $this->user = null;

            return null;
        }

        return $user;
    }
}
