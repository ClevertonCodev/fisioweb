<?php

namespace Modules\Media\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Modules\Media\Models\Video;

interface VideoServiceInterface
{
    public function deleteVideo(int $videoId, bool $forceDelete = false): bool;

    public function getVideo(int $id): ?Video;

    public function getVideoFormatted(int $videoId): array;

    public function getVideoCdnUrl(int $videoId): ?string;

    public function updateMetadata(int $videoId, array $metadata): Video;

    public function getVideosByUploadable(Model $uploadable): Collection;

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator;

    public function requestPresignedUpload(
        string $filename,
        string $mimeType,
        int $size,
        ?string $directory = 'videos',
        ?Model $uploadable = null,
        ?int $clinicId = null,
    ): array;

    public function isOwnedByClinic(int $videoId, int $clinicId): bool;

    public function confirmPresignedUpload(int $videoId, ?string $thumbnailPath = null, ?string $originalFilename = null, ?int $duration = null, ?array $metadata = null): array;

    /**
     * Confirmação feita pela clínica dona: o thumbnail de vídeo travado vira proposta, e o resto da confirmação vale na hora.
     *
     * @return array<string, mixed> o vídeo formatado com `proposal_pending`
     */
    public function confirmUploadByClinic(int $videoId, int $clinicUserId, ?string $thumbnailPath = null, ?string $originalFilename = null, ?int $duration = null): array;

    public function updateVideo(int $videoId, array $data): array;

    /**
     * Troca da capa de vídeo concluído feita pela clínica dona: aplica na hora, ou guarda como proposta quando o vídeo está travado.
     *
     * @return array<string, mixed> o vídeo formatado com `proposal_pending`
     *
     * @throws \InvalidArgumentException
     * @throws \Modules\Media\Exceptions\VideoStorageFileMissingException
     */
    public function changeThumbnailByClinic(int $videoId, int $clinicUserId, string $thumbnailPath): array;

    public function requestPresignedThumbnailReplace(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array;

    public function requestPresignedThumbnailUpload(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array;

    /**
     * @param  list<int>  $alsoIncludeVideoIds
     */
    public function getAvailableForExercise(array $alsoIncludeVideoIds = []): Collection;

    /**
     * @param  list<string>  $referenceImagePaths  paths R2 (máx. 2)
     * @return array<string, mixed>
     */
    public function syncReferenceImages(int $videoId, array $referenceImagePaths, bool $changedByOperator): array;

    /**
     * Troca feita pela clínica dona: aplica na hora, ou guarda como proposta quando o vídeo está travado.
     *
     * @param  list<string>  $referenceImagePaths  paths R2 (máx. 2)
     * @return array<string, mixed> o vídeo formatado com `proposal_pending`
     */
    public function changeReferenceImagesByClinic(int $videoId, int $clinicUserId, array $referenceImagePaths): array;

    /**
     * @param  list<int>  $videoIds
     * @return list<int> os vídeos, entre os informados, com proposta de mídia esperando revisão
     */
    public function videoIdsWithPendingMediaProposal(array $videoIds): array;

    /**
     * @return list<int> todos os vídeos com proposta de mídia esperando revisão, em ordem de id
     */
    public function videoIdsWithAnyPendingMediaProposal(): array;

    /**
     * @param  list<int>  $videoIds
     * @return list<MediaProposal> as propostas pendentes dos vídeos informados, em ordem de id
     */
    public function pendingMediaProposals(array $videoIds): array;

    /**
     * Aplica a proposta ao vídeo e a limpa. Não publica `VideoReferenceImagesChanged`: quem aprova sincroniza o que depende das imagens.
     *
     * @return MediaProposal a proposta aplicada
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Modules\Media\Exceptions\MediaProposalNotPendingException
     * @throws \Modules\Media\Exceptions\MediaProposalChangedException quando a versão não é a que o operador viu
     */
    public function approveMediaProposal(int $videoId, string $version): MediaProposal;

    /**
     * Descarta a proposta e apaga do storage, depois do commit, os objetos propostos que a mídia em uso não usa.
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     * @throws \Modules\Media\Exceptions\MediaProposalNotPendingException
     * @throws \Modules\Media\Exceptions\MediaProposalChangedException quando a versão não é a que o operador viu
     */
    public function rejectMediaProposal(int $videoId, string $version): void;

    /**
     * Garante que cada path foi gerado pelo presigned de substituição deste vídeo (`requestPresignedThumbnailReplace`) ou já está salvo nas imagens de referência dele.
     *
     * @param  list<string>  $referenceImagePaths
     *
     * @throws \InvalidArgumentException
     */
    public function ensureReferenceImagesBelongToVideo(int $videoId, array $referenceImagePaths): void;
}
