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

    /**
     * @throws \Modules\Admin\Exceptions\ExerciseAlreadyApprovedException
     */
    public function reject(int $id, int $reviewerId, ?string $reason = null): Exercise;

    /**
     * Exercícios pendentes mais as propostas de mídia esperando o operador.
     */
    public function pendingCount(): int;
}
