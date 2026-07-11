<?php

namespace Modules\TreatmentProgram\Contracts;

interface ProgramDraftServiceInterface
{
    /**
     * Retorna o conteúdo do rascunho do usuário, ou null se não houver.
     *
     * @return array<string, mixed>|null
     */
    public function showForUser(int $clinicUserId): ?array;

    /**
     * Cria ou atualiza o rascunho do usuário e dispara o evento correspondente.
     *
     * @param  array<string, mixed>  $draftData
     */
    public function upsertForUser(int $clinicId, int $clinicUserId, array $draftData): void;

    public function destroyForUser(int $clinicUserId): void;
}
