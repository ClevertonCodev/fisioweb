<?php

namespace Modules\Admin\Contracts\Public;

use Modules\Admin\Models\Exercise;

/**
 * Contrato público do módulo Admin para submissão de exercícios pela clínica
 * e revisão (aprovação/rejeição) pelo admin do sistema.
 */
interface ExerciseSubmissionServiceInterface
{
    public function submit(array $data, int $clinicId, int $clinicUserId): Exercise;

    public function approve(int $id, int $reviewerId): Exercise;

    public function reject(int $id, int $reviewerId, ?string $reason = null): Exercise;

    public function pendingCount(): int;
}
