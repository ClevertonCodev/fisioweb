<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\Models\ClinicProgramDraft;

interface ProgramDraftRepositoryInterface
{
    public function findByUser(int $clinicUserId): ?ClinicProgramDraft;

    /**
     * Cria ou atualiza o rascunho do usuário.
     *
     * @param  array<string, mixed>  $draftData
     * @return array{0: ClinicProgramDraft, 1: bool} O rascunho e se foi criado agora.
     */
    public function upsert(int $clinicId, int $clinicUserId, array $draftData): array;

    public function deleteByUser(int $clinicUserId): void;

    public function existsForUser(int $clinicUserId): bool;
}
