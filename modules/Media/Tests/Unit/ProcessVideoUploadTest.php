<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Jobs\ProcessVideoUpload;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
use RuntimeException;
use Tests\TestCase;

class ProcessVideoUploadTest extends TestCase
{
    protected VideoRepository $repository;

    protected FileServiceInterface $fileService;

    protected string $tempFile;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->mock(VideoRepository::class);
        $this->fileService = $this->mock(FileServiceInterface::class);

        $tempDir = storage_path('app/private/temp/videos');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        $this->tempFile = $tempDir.'/test_video.mp4';
        file_put_contents($this->tempFile, 'fake video content');
    }

    protected function tearDown(): void
    {
        if (file_exists($this->tempFile)) {
            unlink($this->tempFile);
        }

        parent::tearDown();
    }

    public function test_should_upload_file_and_update_status_to_completed(): void
    {
        $completedVideo = new Video(['status' => Video::STATUS_COMPLETED]);
        $completedVideo->id = 1;

        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(fn ($id, $data) => $id === 1 && $data['status'] === Video::STATUS_PROCESSING)
            ->andReturn(new Video(['status' => Video::STATUS_PROCESSING]));

        $this->fileService
            ->shouldReceive('uploadFromPath')
            ->once()
            ->with($this->tempFile, 'videos', 'original.mp4')
            ->andReturn([
                'filename' => 'uuid_123.mp4',
                'original_filename' => 'original.mp4',
                'path' => 'videos/uuid_123.mp4',
                'url' => 'https://r2.example.com/videos/uuid_123.mp4',
                'cdn_url' => 'https://cdn.example.com/videos/uuid_123.mp4',
                'mime_type' => 'video/mp4',
                'size' => 5120000,
            ]);

        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(fn ($id, $data) => $id === 1 && $data['status'] === Video::STATUS_COMPLETED)
            ->andReturn($completedVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->times(3);

        $job = new ProcessVideoUpload(
            videoId: 1,
            localPath: $this->tempFile,
            directory: 'videos',
            originalFilename: 'original.mp4',
        );

        $job->handle($this->fileService, $this->repository);

        $this->assertFileDoesNotExist($this->tempFile);
    }

    public function test_should_rethrow_exception_for_retry_on_upload_failure(): void
    {
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(fn ($id, $data) => $data['status'] === Video::STATUS_PROCESSING)
            ->andReturn(new Video(['status' => Video::STATUS_PROCESSING]));

        $this->fileService
            ->shouldReceive('uploadFromPath')
            ->once()
            ->andThrow(new RuntimeException('R2 connection failed'));

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();
        Log::shouldReceive('error')->once();

        $job = new ProcessVideoUpload(
            videoId: 1,
            localPath: $this->tempFile,
            directory: 'videos',
            originalFilename: 'original.mp4',
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('R2 connection failed');

        $job->handle($this->fileService, $this->repository);
    }

    public function test_should_keep_temp_file_on_retryable_failure(): void
    {
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->andReturn(new Video(['status' => Video::STATUS_PROCESSING]));

        $this->fileService
            ->shouldReceive('uploadFromPath')
            ->once()
            ->andThrow(new RuntimeException('Temporary failure'));

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();
        Log::shouldReceive('error')->once();

        $job = new ProcessVideoUpload(
            videoId: 1,
            localPath: $this->tempFile,
            directory: 'videos',
            originalFilename: 'original.mp4',
        );

        try {
            $job->handle($this->fileService, $this->repository);
        } catch (RuntimeException) {
            // Expected
        }

        $this->assertFileExists($this->tempFile);
    }

    public function test_should_update_status_to_failed_and_cleanup_on_permanent_failure(): void
    {
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(fn ($id, $data) => $id === 1 && $data['status'] === Video::STATUS_FAILED)
            ->andReturn(new Video(['status' => Video::STATUS_FAILED]));

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('error')->once();
        Log::shouldReceive('info')->once();

        $job = new ProcessVideoUpload(
            videoId: 1,
            localPath: $this->tempFile,
            directory: 'videos',
            originalFilename: 'original.mp4',
        );

        $job->failed(new RuntimeException('All retries exhausted'));

        $this->assertFileDoesNotExist($this->tempFile);
    }

    public function test_should_be_dispatched_to_queue(): void
    {
        Queue::fake();

        ProcessVideoUpload::dispatch(
            videoId: 1,
            localPath: '/tmp/test.mp4',
            directory: 'videos',
            originalFilename: 'test.mp4',
        );

        Queue::assertPushed(ProcessVideoUpload::class, function ($job) {
            return $job->videoId === 1
                && $job->localPath === '/tmp/test.mp4'
                && $job->directory === 'videos'
                && $job->originalFilename === 'test.mp4';
        });
    }

    public function test_should_have_correct_retry_configuration(): void
    {
        $job = new ProcessVideoUpload(
            videoId: 1,
            localPath: '/tmp/test.mp4',
            directory: 'videos',
            originalFilename: 'test.mp4',
        );

        $this->assertEquals(3, $job->tries);
        $this->assertEquals([30, 60, 120], $job->backoff);
        $this->assertEquals(600, $job->timeout);
    }

    public function test_should_be_serializable(): void
    {
        $job = new ProcessVideoUpload(
            videoId: 42,
            localPath: '/tmp/video.mp4',
            directory: 'videos',
            originalFilename: 'my_video.mp4',
        );

        $serialized = serialize($job);
        $unserialized = unserialize($serialized);

        $this->assertEquals(42, $unserialized->videoId);
        $this->assertEquals('/tmp/video.mp4', $unserialized->localPath);
        $this->assertEquals('videos', $unserialized->directory);
        $this->assertEquals('my_video.mp4', $unserialized->originalFilename);
    }
}
