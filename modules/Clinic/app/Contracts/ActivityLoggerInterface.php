<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Database\Eloquent\Model;
use Modules\Clinic\Enums\ActivityType;

interface ActivityLoggerInterface
{
    /**
     * Registra um evento no log de atividades da clínica (FR-022a/b).
     * O ator é resolvido a partir do usuário autenticado (guard clinic).
     */
    public function log(int $clinicId, ActivityType $type, string $description, ?Model $subject = null): void;
}
