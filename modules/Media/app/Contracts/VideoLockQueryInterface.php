<?php

namespace Modules\Media\Contracts;

/**
 * Porta do Media, implementada por quem liga vídeo a exercício (o Admin), para o Media não depender desse módulo.
 */
interface VideoLockQueryInterface
{
    /**
     * Vídeo travado: a mídia dele já foi aprovada para outras clínicas, então a troca feita pela clínica dona vira proposta.
     */
    public function isLocked(int $videoId, int $ownerClinicId): bool;
}
