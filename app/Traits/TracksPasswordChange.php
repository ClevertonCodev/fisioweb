<?php

namespace App\Traits;

/**
 * Marca `password_changed_at` sempre que a senha muda num registro que já
 * existe, por qualquer caminho (reset, edição, primeiro acesso). A criação não
 * conta: o token de antes da conta não existe.
 */
trait TracksPasswordChange
{
    protected static function bootTracksPasswordChange(): void
    {
        static::updating(function (self $model): void {
            if ($model->isDirty('password')) {
                $model->password_changed_at = now();
            }
        });
    }

    public function initializeTracksPasswordChange(): void
    {
        $this->mergeCasts(['password_changed_at' => 'datetime']);
        $this->makeHidden('password_changed_at');
    }

    public function tokenIssuedBeforePasswordChange(int $issuedAt): bool
    {
        return !is_null($this->password_changed_at)
            && $issuedAt < $this->password_changed_at->getTimestamp();
    }
}
