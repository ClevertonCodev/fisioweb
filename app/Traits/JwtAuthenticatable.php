<?php

namespace App\Traits;

trait JwtAuthenticatable
{
    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'guard' => static::GUARD_NAME,
        ];
    }
}
