<?php

namespace Modules\Media\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;

class ProcessVideoUpload implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public int $timeout = 600;

    public function __construct(
        public readonly int $videoId,
        public readonly string $localPath,
        public readonly string $directory,
        public readonly string $originalFilename,
    ) {}

    public function handle(
        FileServiceInterface $fileService,
        VideoRepository $videoRepository,
    ): void {
        logInfo('processando video upload job', [
            'video_id' => $this->videoId,
            'local_path' => $this->localPath,
        ]);

        $videoRepository->update($this->videoId, [
            'status' => Video::STATUS_PROCESSING,
        ]);

        try {
            $fileData = $fileService->uploadFromPath(
                $this->localPath,
                $this->directory,
                $this->originalFilename,
            );

            $videoRepository->update($this->videoId, [
                'filename' => $fileData['filename'],
                'path' => $fileData['path'],
                'url' => $fileData['url'],
                'cdn_url' => $fileData['cdn_url'],
                'status' => Video::STATUS_COMPLETED,
                'metadata' => [
                    'original_name' => $fileData['original_filename'],
                    'mime_type' => $fileData['mime_type'],
                    'size' => $fileData['size'],
                ],
            ]);

            $this->cleanupTempFile();

            logInfo('video upload job completado com sucesso', [
                'video_id' => $this->videoId,
                'path' => $fileData['path'],
            ]);
        } catch (\Throwable $e) {
            logError('video upload job tentativa falhou', [
                'video_id' => $this->videoId,
                'attempt' => $this->attempts(),
                'max_tries' => $this->tries,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        logError('video upload job permanentemente falhou', [
            'video_id' => $this->videoId,
            'error' => $exception->getMessage(),
        ]);

        app(VideoRepository::class)->update($this->videoId, [
            'status' => Video::STATUS_FAILED,
            'metadata' => [
                'error' => $exception->getMessage(),
                'failed_at' => now()->toISOString(),
            ],
        ]);

        $this->cleanupTempFile();
    }

    protected function cleanupTempFile(): void
    {
        if (file_exists($this->localPath)) {
            unlink($this->localPath);
            logInfo('arquivo temporário removido', ['path' => $this->localPath]);
        }
    }
}
