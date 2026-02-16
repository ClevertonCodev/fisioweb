<?php

namespace Modules\Media\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Jobs\ProcessVideoUpload;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;

class VideoService implements VideoServiceInterface
{
    public function __construct(
        protected FileServiceInterface $fileService,
        protected VideoRepository $videoRepository,
    ) {}

    public function dispatchUpload(
        UploadedFile $file,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array {
        if (empty($directory)) {
            throw new \InvalidArgumentException('Diretório não informado');
        }

        $tempPath     = $file->store('temp/videos', 'local');
        $fullTempPath = storage_path('app/private/' . $tempPath);

        $video = $this->videoRepository->create([
            'filename'          => $file->getClientOriginalName(),
            'original_filename' => $file->getClientOriginalName(),
            'path'              => '',
            'mime_type'         => $file->getMimeType(),
            'size'              => $file->getSize(),
            'status'            => Video::STATUS_PENDING,
            'uploadable_type'   => $uploadable?->getMorphClass(),
            'uploadable_id'     => $uploadable?->id,
        ]);

        ProcessVideoUpload::dispatch(
            videoId: $video->id,
            localPath: $fullTempPath,
            directory: $directory,
            originalFilename: $file->getClientOriginalName(),
        );

        logInfo('video upload enviado para a fila', [
            'video_id'  => $video->id,
            'temp_path' => $fullTempPath,
        ]);

        return $this->formatVideo($video);
    }

    public function dispatchMultipleUploads(
        array $files,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array {
        $dispatched = [];

        foreach ($files as $file) {
            $dispatched[] = $this->dispatchUpload($file, $directory, $uploadable);
        }

        if (empty($dispatched)) {
            return [];
        }

        return [
            'queued' => count($dispatched),
            'videos' => $dispatched,
        ];
    }

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

        logInfo('video deletado com sucesso', [
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

    public function requestPresignedUpload(
        string $filename,
        string $mimeType,
        int $size,
        ?string $directory = 'videos',
        ?Model $uploadable = null,
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
            'metadata'          => [
                'original_name' => $filename,
                'upload_method' => 'presigned',
            ],
        ]);

        $presigned = $this->fileService->createPresignedUploadUrl($path, $mimeType);

        logInfo('presigned upload solicitado', [
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

        logInfo('presigned thumbnail solicitado', [
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
                throw new \RuntimeException('Thumbnail não encontrada no storage.');
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

        $this->videoRepository->update($videoId, [
            'metadata' => $metadata,
        ]);

        logInfo('presigned thumbnail replace solicitado', [
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
        $video = $this->videoRepository->findOrFail($videoId);

        if ($video->status !== Video::STATUS_PENDING) {
            throw new \InvalidArgumentException("Vídeo não está pendente de confirmação (status atual: {$video->status})");
        }

        if (empty($video->path)) {
            throw new \InvalidArgumentException('Vídeo não possui path definido');
        }

        if (!$this->fileService->fileExists($video->path)) {
            throw new \RuntimeException('Arquivo não encontrado no storage. O upload pode ter falhado.');
        }

        $metadata = $video->metadata ?? [];
        unset($metadata['pending_thumbnail_path']);
        if ($metadataMerge !== null && !empty($metadataMerge)) {
            $metadata = array_merge($metadata, $metadataMerge);
        }

        $update = [
            'url'      => $this->fileService->getFileUrl($video->path),
            'cdn_url'  => $this->fileService->getFileCdnUrl($video->path),
            'status'   => Video::STATUS_COMPLETED,
            'metadata' => $metadata,
        ];

        if ($originalFilename !== null && $originalFilename !== '') {
            $update['original_filename'] = $originalFilename;
        }

        if ($duration !== null) {
            $update['duration'] = $duration;
        }

        if ($thumbnailPath !== null && $thumbnailPath !== '') {
            $pendingPath = ($video->metadata ?? [])['pending_thumbnail_path'] ?? null;
            if ($pendingPath !== $thumbnailPath) {
                throw new \InvalidArgumentException('Thumbnail não autorizada para este vídeo.');
            }
            if (!$this->fileService->fileExists($thumbnailPath)) {
                throw new \RuntimeException('Thumbnail não encontrada no storage.');
            }

            $update['thumbnail_path'] = $thumbnailPath;
            $update['thumbnail_url']  = $this->fileService->getFileCdnUrl($thumbnailPath);
        }

        $video = $this->videoRepository->update($videoId, $update);

        logInfo('presigned upload confirmado', [
            'video_id'  => $videoId,
            'path'      => $video->path,
            'thumbnail' => $thumbnailPath,
        ]);

        return $this->formatVideo($video);
    }

    public function getAvailableForExercise(): Collection
    {
        return $this->videoRepository->getAvailableForExercise()
            ->map(fn (Video $video) => $this->formatVideo($video));
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
