<?php

namespace Modules\Media\Services;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\VideoLockQueryInterface;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Events\VideoReferenceImagesChanged;
use Modules\Media\Exceptions\VideoStorageFileMissingException;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;

class VideoService implements VideoServiceInterface
{
    /** Quantos paths emitidos pelo presigned de substituição ficam guardados por vídeo (as 2 fotos do PDF, com folga para trocas). */
    private const MAX_ISSUED_IMAGE_PATHS = 10;

    public function __construct(
        protected FileServiceInterface $fileService,
        protected VideoRepository $videoRepository,
        protected VideoLockQueryInterface $videoLock,
    ) {}

    public function deleteVideo(int $videoId, bool $forceDelete = false): bool
    {
        $video = $this->videoRepository->findOrFail($videoId);

        $this->fileService->deleteFile($video->path);

        if ($video->thumbnail_path) {
            $this->fileService->deleteFile($video->thumbnail_path);
        }

        $forceDelete
            ? $this->videoRepository->forceDelete($videoId)
            : $this->videoRepository->delete($videoId);

        Log::info('video deletado com sucesso', [
            'video_id'     => $videoId,
            'force_delete' => $forceDelete,
        ]);

        return true;
    }

    public function getVideo(int $id): ?Video
    {
        return $this->videoRepository->find($id);
    }

    public function getVideoFormatted(int $videoId): array
    {
        $video = $this->videoRepository->findOrFail($videoId);

        return $this->formatVideo($video);
    }

    public function getVideoCdnUrl(int $videoId): ?string
    {
        return $this->videoRepository->find($videoId)?->cdn_url;
    }

    public function updateMetadata(int $videoId, array $metadata): Video
    {
        $video = $this->videoRepository->findOrFail($videoId);

        return $this->videoRepository->update($videoId, [
            'metadata' => array_merge($video->metadata ?? [], $metadata),
        ]);
    }

    public function getVideosByUploadable(Model $uploadable): Collection
    {
        return $this->videoRepository->findByUploadable($uploadable);
    }

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator
    {
        return $this->videoRepository->paginate($perPage);
    }

    public function isOwnedByClinic(int $videoId, int $clinicId): bool
    {
        return $this->videoRepository->isOwnedByClinic($videoId, $clinicId);
    }

    public function requestPresignedUpload(
        string $filename,
        string $mimeType,
        int $size,
        ?string $directory = 'videos',
        ?Model $uploadable = null,
        ?int $clinicId = null,
    ): array {
        if (empty($directory)) {
            throw new \InvalidArgumentException('Diretório não informado');
        }

        $extension         = pathinfo($filename, PATHINFO_EXTENSION);
        $generatedFilename = Str::uuid() . '_' . now()->timestamp . '.' . $extension;
        $path              = "{$directory}/{$generatedFilename}";

        $video = $this->videoRepository->create([
            'filename'          => $generatedFilename,
            'original_filename' => $filename,
            'path'              => $path,
            'mime_type'         => $mimeType,
            'size'              => $size,
            'status'            => Video::STATUS_PENDING,
            'uploadable_type'   => $uploadable?->getMorphClass(),
            'uploadable_id'     => $uploadable?->id,
            'clinic_id'         => $clinicId,
            'metadata'          => [
                'original_name' => $filename,
                'upload_method' => 'presigned',
            ],
        ]);

        $presigned = $this->fileService->createPresignedUploadUrl($path, $mimeType);

        Log::info('presigned upload solicitado', [
            'video_id' => $video->id,
            'path'     => $path,
        ]);

        return [
            'video_id'   => $video->id,
            'upload_url' => $presigned['upload_url'],
            'path'       => $presigned['path'],
            'expires_at' => $presigned['expires_at'],
            'video'      => $this->formatVideo($video),
        ];
    }

    public function requestPresignedThumbnailUpload(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array {
        $video = $this->videoRepository->findOrFail($videoId);

        if ($video->status !== Video::STATUS_PENDING) {
            throw new \InvalidArgumentException("Só é possível enviar thumbnail para vídeo pendente (status atual: {$video->status})");
        }

        $directory         = config('cloudflare.thumbnail_directory', 'thumbnails') . '/videos';
        $extension         = pathinfo($filename, PATHINFO_EXTENSION);
        $generatedFilename = Str::uuid() . '_' . now()->timestamp . '.' . $extension;
        $path              = "{$directory}/{$generatedFilename}";

        $presigned = $this->fileService->createPresignedUploadUrl($path, $mimeType);

        $metadata                           = $video->metadata ?? [];
        $metadata['pending_thumbnail_path'] = $path;

        $this->videoRepository->update($videoId, [
            'metadata' => $metadata,
        ]);

        Log::info('presigned thumbnail solicitado', [
            'video_id' => $videoId,
            'path'     => $path,
        ]);

        return [
            'upload_url' => $presigned['upload_url'],
            'path'       => $presigned['path'],
            'expires_at' => $presigned['expires_at'],
        ];
    }

    public function updateVideo(int $videoId, array $data): array
    {
        $video = $this->videoRepository->findOrFail($videoId);

        $update = [];

        if (array_key_exists('original_filename', $data) && $data['original_filename'] !== null) {
            $update['original_filename'] = $data['original_filename'];
        }

        if (array_key_exists('duration', $data)) {
            $update['duration'] = $data['duration'] === null || $data['duration'] === ''
                ? null
                : (int) $data['duration'];
        }

        if (array_key_exists('metadata', $data)) {
            $update['metadata'] = is_array($data['metadata'])
                ? $data['metadata']
                : (array) json_decode($data['metadata'] ?? '{}', true);
        }

        if (array_key_exists('thumbnail_path', $data) && $data['thumbnail_path'] !== null && $data['thumbnail_path'] !== '') {
            $pendingPath = ($video->metadata ?? [])['pending_thumbnail_path'] ?? null;
            if ($pendingPath !== $data['thumbnail_path']) {
                throw new \InvalidArgumentException('Thumbnail não autorizada para este vídeo.');
            }
            if (!$this->fileService->fileExists($data['thumbnail_path'])) {
                throw new VideoStorageFileMissingException('Thumbnail não encontrada no storage.');
            }

            if ($video->thumbnail_path) {
                $this->fileService->deleteFile($video->thumbnail_path);
            }

            $update['thumbnail_path'] = $data['thumbnail_path'];
            $update['thumbnail_url']  = $this->fileService->getFileCdnUrl($data['thumbnail_path']);

            $metadata = $video->metadata ?? [];
            unset($metadata['pending_thumbnail_path']);
            $update['metadata'] = $metadata;
        }

        if (!empty($update)) {
            $this->videoRepository->update($videoId, $update);
        }

        return $this->formatVideo($this->videoRepository->findOrFail($videoId));
    }

    public function requestPresignedThumbnailReplace(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array {
        $video = $this->videoRepository->findOrFail($videoId);

        if ($video->status !== Video::STATUS_COMPLETED) {
            throw new \InvalidArgumentException("Só é possível substituir thumbnail de vídeo concluído (status atual: {$video->status})");
        }

        $directory         = config('cloudflare.thumbnail_directory', 'thumbnails') . '/videos';
        $extension         = pathinfo($filename, PATHINFO_EXTENSION);
        $generatedFilename = Str::uuid() . '_' . now()->timestamp . '.' . $extension;
        $path              = "{$directory}/{$generatedFilename}";

        $presigned = $this->fileService->createPresignedUploadUrl($path, $mimeType);

        $metadata                           = $video->metadata ?? [];
        $metadata['pending_thumbnail_path'] = $path;
        $metadata['issued_image_paths']     = array_slice([...($metadata['issued_image_paths'] ?? []), $path], -self::MAX_ISSUED_IMAGE_PATHS);

        $this->videoRepository->update($videoId, [
            'metadata' => $metadata,
        ]);

        Log::info('presigned thumbnail replace solicitado', [
            'video_id' => $videoId,
            'path'     => $path,
        ]);

        return [
            'upload_url' => $presigned['upload_url'],
            'path'       => $presigned['path'],
            'expires_at' => $presigned['expires_at'],
        ];
    }

    public function confirmPresignedUpload(int $videoId, ?string $thumbnailPath = null, ?string $originalFilename = null, ?int $duration = null, ?array $metadataMerge = null): array
    {
        $video  = $this->videoRepository->findOrFail($videoId);
        $update = $this->confirmationUpdate($video, $thumbnailPath, $originalFilename, $duration, $metadataMerge);

        if (!empty($thumbnailPath)) {
            $update['thumbnail_path'] = $thumbnailPath;
            $update['thumbnail_url']  = $this->fileService->getFileCdnUrl($thumbnailPath);
        }

        return $this->formatVideo($this->saveConfirmation($videoId, $update, $thumbnailPath));
    }

    public function confirmUploadByClinic(int $videoId, int $clinicUserId, ?string $thumbnailPath = null, ?string $originalFilename = null, ?int $duration = null): array
    {
        $video = $this->videoRepository->findOrFail($videoId);

        if (empty($thumbnailPath) || !$this->videoLock->isLocked($videoId, (int) $video->clinic_id)) {
            return $this->withProposalFlag($this->confirmPresignedUpload($videoId, $thumbnailPath, $originalFilename, $duration));
        }

        $update             = $this->confirmationUpdate($video, $thumbnailPath, $originalFilename, $duration, null);
        $update['metadata'] = $this->withProposal($update['metadata'], $clinicUserId, [
            'proposed_thumbnail_path' => $thumbnailPath,
        ]);

        return $this->withProposalFlag($this->formatVideo($this->saveConfirmation($videoId, $update, $thumbnailPath)));
    }

    public function changeThumbnailByClinic(int $videoId, int $clinicUserId, string $thumbnailPath): array
    {
        $video = $this->videoRepository->findOrFail($videoId);

        if ($video->status !== Video::STATUS_COMPLETED) {
            throw new \InvalidArgumentException("Só é possível trocar a capa de vídeo concluído (status atual: {$video->status})");
        }

        if (!in_array($thumbnailPath, $video->metadata['issued_image_paths'] ?? [], true)) {
            throw new \InvalidArgumentException('Capa não autorizada para este vídeo.');
        }

        if (!$this->fileService->fileExists($thumbnailPath)) {
            throw new VideoStorageFileMissingException('Capa não encontrada no storage.');
        }

        if (!$this->videoLock->isLocked($videoId, (int) $video->clinic_id)) {
            $video = $this->videoRepository->update($videoId, [
                'thumbnail_path' => $thumbnailPath,
                'thumbnail_url'  => $this->fileService->getFileCdnUrl($thumbnailPath),
            ]);

            return $this->withProposalFlag($this->formatVideo($video));
        }

        $video = $this->videoRepository->update($videoId, [
            'metadata' => $this->withProposal($video->metadata ?? [], $clinicUserId, [
                'proposed_thumbnail_path' => $thumbnailPath,
            ]),
        ]);

        return $this->withProposalFlag($this->formatVideo($video));
    }

    public function getAvailableForExercise(array $alsoIncludeVideoIds = []): Collection
    {
        return $this->videoRepository->getAvailableForExercise($alsoIncludeVideoIds)
            ->map(fn (Video $video) => $this->formatVideo($video));
    }

    public function syncReferenceImages(int $videoId, array $referenceImagePaths, bool $changedByOperator): array
    {
        $video  = $this->videoRepository->findOrFail($videoId);
        $images = $this->referenceImages($referenceImagePaths);

        $metadata                     = $video->metadata ?? [];
        $metadata['reference_images'] = $images;
        $video                        = $this->videoRepository->update($videoId, ['metadata' => $metadata]);

        Event::dispatch(new VideoReferenceImagesChanged(
            version: 1,
            videoId: $videoId,
            ownerClinicId: $video->clinic_id,
            changedByOperator: $changedByOperator,
            images: $images,
            occurredAt: CarbonImmutable::now(),
        ));

        return $this->formatVideo($video);
    }

    public function changeReferenceImagesByClinic(int $videoId, int $clinicUserId, array $referenceImagePaths): array
    {
        $video = $this->videoRepository->findOrFail($videoId);

        if (!$this->videoLock->isLocked($videoId, (int) $video->clinic_id)) {
            return $this->withProposalFlag($this->syncReferenceImages($videoId, $referenceImagePaths, changedByOperator: false));
        }

        $video = $this->videoRepository->update($videoId, [
            'metadata' => $this->withProposal($video->metadata ?? [], $clinicUserId, [
                'proposed_reference_images' => $this->referenceImages($referenceImagePaths),
            ]),
        ]);

        return $this->withProposalFlag($this->formatVideo($video));
    }

    public function videoIdsWithPendingMediaProposal(array $videoIds): array
    {
        return $this->videoRepository->idsWithPendingMediaProposal($videoIds);
    }

    public function ensureReferenceImagesBelongToVideo(int $videoId, array $referenceImagePaths): void
    {
        $metadata = $this->videoRepository->findOrFail($videoId)->metadata ?? [];
        $allowed  = [
            ...($metadata['issued_image_paths'] ?? []),
            ...array_column($metadata['reference_images'] ?? [], 'file_path'),
        ];

        foreach ($referenceImagePaths as $path) {
            if (!in_array($path, $allowed, true)) {
                throw new \InvalidArgumentException('Imagem de referência não autorizada para este vídeo.');
            }
        }
    }

    /**
     * @param  array<string, mixed>|null  $metadataMerge
     * @return array<string, mixed>
     *
     * @throws \InvalidArgumentException
     * @throws VideoStorageFileMissingException
     */
    private function confirmationUpdate(Video $video, ?string $thumbnailPath, ?string $originalFilename, ?int $duration, ?array $metadataMerge): array
    {
        if ($video->status !== Video::STATUS_PENDING) {
            throw new \InvalidArgumentException("Vídeo não está pendente de confirmação (status atual: {$video->status})");
        }

        if (empty($video->path)) {
            throw new \InvalidArgumentException('Vídeo não possui path definido');
        }

        if (!$this->fileService->fileExists($video->path)) {
            throw new VideoStorageFileMissingException('Arquivo não encontrado no storage. O upload pode ter falhado.');
        }

        if (!empty($thumbnailPath)) {
            $pendingPath = ($video->metadata ?? [])['pending_thumbnail_path'] ?? null;
            if ($pendingPath !== $thumbnailPath) {
                throw new \InvalidArgumentException('Thumbnail não autorizada para este vídeo.');
            }
            if (!$this->fileService->fileExists($thumbnailPath)) {
                throw new VideoStorageFileMissingException('Thumbnail não encontrada no storage.');
            }
        }

        $metadata = $video->metadata ?? [];
        unset($metadata['pending_thumbnail_path']);
        if (!empty($metadataMerge)) {
            $metadata = array_merge($metadata, $metadataMerge);
        }

        $update = [
            'url'      => $this->fileService->getFileUrl($video->path),
            'cdn_url'  => $this->fileService->getFileCdnUrl($video->path),
            'status'   => Video::STATUS_COMPLETED,
            'metadata' => $metadata,
        ];

        if (!empty($originalFilename)) {
            $update['original_filename'] = $originalFilename;
        }

        if (!is_null($duration)) {
            $update['duration'] = $duration;
        }

        return $update;
    }

    /**
     * @param  array<string, mixed>  $update
     */
    private function saveConfirmation(int $videoId, array $update, ?string $thumbnailPath): Video
    {
        $video = $this->videoRepository->update($videoId, $update);

        Log::info('presigned upload confirmado', [
            'video_id'  => $videoId,
            'path'      => $video->path,
            'thumbnail' => $thumbnailPath,
        ]);

        return $video;
    }

    /**
     * @param  list<string>  $referenceImagePaths
     * @return list<array{file_path: string, cdn_url: string, original_filename: string, mime_type: string, size: int}>
     */
    private function referenceImages(array $referenceImagePaths): array
    {
        $paths = array_values(array_filter(
            array_slice($referenceImagePaths, 0, 2),
            fn ($path) => is_string($path) && !empty($path)
        ));

        return array_map(fn (string $path) => [
            'file_path'         => $path,
            'cdn_url'           => $this->fileService->getFileCdnUrl($path),
            'original_filename' => basename($path),
            'mime_type'         => str_ends_with(strtolower($path), '.png') ? 'image/png' : 'image/jpeg',
            'size'              => 0,
        ], $paths);
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @param  array<string, mixed>  $proposed
     * @return array<string, mixed>
     */
    private function withProposal(array $metadata, int $clinicUserId, array $proposed): array
    {
        return [
            ...$metadata,
            ...$proposed,
            'proposed_at'                => now()->toIso8601String(),
            'proposed_by_clinic_user_id' => $clinicUserId,
        ];
    }

    /**
     * @param  array<string, mixed>  $formattedVideo
     * @return array<string, mixed>
     */
    private function withProposalFlag(array $formattedVideo): array
    {
        return [
            ...$formattedVideo,
            'proposal_pending' => !empty($formattedVideo['metadata']['proposed_at'] ?? null),
        ];
    }

    protected function formatVideo(Video $video): array
    {
        return [
            'id'                => $video->id,
            'filename'          => $video->filename,
            'original_filename' => $video->original_filename,
            'url'               => $video->url,
            'cdn_url'           => $video->cdn_url,
            'thumbnail_url'     => $video->thumbnail_url,
            'size'              => $video->size,
            'human_size'        => $video->human_size,
            'duration'          => $video->duration,
            'human_duration'    => $video->human_duration,
            'metadata'          => $video->metadata,
            'status'            => $video->status,
            'mime_type'         => $video->mime_type,
        ];
    }
}
