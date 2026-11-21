<?php

namespace Modules\Email\Contracts;

interface ReminderUnsubscribeServiceInterface
{
    /**
     * @return bool `false` quando o token não é válido para nenhum paciente
     */
    public function unsubscribe(string $token): bool;
}
