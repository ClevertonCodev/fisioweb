<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;

class QueuedResetPassword extends ResetPassword implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        #[\SensitiveParameter] string $token,
        #[\SensitiveParameter] public readonly string $url,
    ) {
        parent::__construct($token);
    }

    protected function resetUrl($notifiable): string
    {
        return $this->url;
    }

    public function failed(\Throwable $e): void
    {
        logError('falha ao enviar e-mail de redefinição de senha', [
            'error' => $e::class,
        ]);
    }
}
