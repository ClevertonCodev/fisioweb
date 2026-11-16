<?php

namespace Modules\Admin\Contracts;

interface ExerciseMediaProposalServiceInterface
{
    /**
     * Uma entrada por vídeo com proposta e ligado a pelo menos um exercício, em ordem de id do vídeo.
     *
     * @return array{items: list<array<string, mixed>>, total: int, current_page: int, per_page: int, last_page: int}
     */
    public function list(int $page, int $perPage): array;

    public function count(): int;

    /**
     * Aplica a proposta do vídeo ligado ao exercício e sincroniza as imagens do PDF de todos os exercícios ligados a ele. O exercício não muda de status.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Modules\Media\Exceptions\MediaProposalNotPendingException
     * @throws \Modules\Media\Exceptions\MediaProposalChangedException
     */
    public function approve(int $exerciseId, int $videoId, string $version): void;

    /**
     * Descarta a proposta do vídeo ligado ao exercício e apaga os objetos propostos que não estão em uso. O exercício não muda de status.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Modules\Media\Exceptions\MediaProposalNotPendingException
     * @throws \Modules\Media\Exceptions\MediaProposalChangedException
     */
    public function reject(int $exerciseId, int $videoId, string $version): void;
}
