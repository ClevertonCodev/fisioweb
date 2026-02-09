<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Jobs\ProcessVideoUpload;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
use Modules\Media\Services\VideoService;
use RuntimeException;
use Tests\TestCase;

class VideoServiceTest extends TestCase
{
    protected VideoRepository $repository;

    protected FileServiceInterface $fileService;

    protected VideoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.video_directory' => 'videos']);

        $this->repository = $this->mock(VideoRepository::class);
        $this->fileService = $this->mock(FileServiceInterface::class);
        $this->service = new VideoService($this->fileService, $this->repository);
    }

    public function test_should_create_record_and_upload_to_storage_on_upload_video(): void
    {
        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video([
            'id' => 1,
            'filename' => 'video.mp4',
            'status' => Video::STATUS_PROCESSING,
        ]);
        $pendingVideo->id = 1;

        $completedVideo = new Video([
            'id' => 1,
            'filename' => 'uuid_123.mp4',
            'status' => Video::STATUS_COMPLETED,
            'url' => 'https://r2.example.com/videos/uuid_123.mp4',
            'cdn_url' => 'https://cdn.example.com/videos/uuid_123.mp4',
        ]);
        $completedVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->withArgs(function ($data) {
                return $data['original_filename'] === 'video.mp4'
                    && $data['mime_type'] === 'video/mp4'
                    && $data['status'] === Video::STATUS_PROCESSING;
            })
            ->andReturn($pendingVideo);

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->andReturn([
                'filename' => 'uuid_123.mp4',
                'original_filename' => 'video.mp4',
                'path' => 'videos/uuid_123.mp4',
                'url' => 'https://r2.example.com/videos/uuid_123.mp4',
                'cdn_url' => 'https://cdn.example.com/videos/uuid_123.mp4',
                'mime_type' => 'video/mp4',
                'size' => 5120000,
            ]);

        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $id === 1
                    && $data['status'] === Video::STATUS_COMPLETED
                    && $data['cdn_url'] === 'https://cdn.example.com/videos/uuid_123.mp4'
                    && isset($data['metadata']);
            })
            ->andReturn($completedVideo);

        $result = $this->service->uploadVideo($file);

        $this->assertInstanceOf(Video::class, $result);
        $this->assertEquals(Video::STATUS_COMPLETED, $result->status);
    }

    public function test_should_mark_as_failed_when_storage_fails_on_upload_video(): void
    {
        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video([
            'id' => 1,
            'filename' => 'video.mp4',
            'status' => Video::STATUS_PROCESSING,
        ]);
        $pendingVideo->id = 1;

        $failedVideo = new Video([
            'id' => 1,
            'status' => Video::STATUS_FAILED,
        ]);
        $failedVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->andReturn($pendingVideo);

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->andThrow(new RuntimeException('Failed to upload file to R2'));

        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $id === 1 && $data['status'] === Video::STATUS_FAILED;
            })
            ->andReturn($failedVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('error')->once();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Failed to upload video');

        $this->service->uploadVideo($file);
    }

    public function test_should_return_success_and_errors_on_upload_multiple_videos(): void
    {
        $file1 = UploadedFile::fake()->create('video1.mp4', 5000, 'video/mp4');
        $file2 = UploadedFile::fake()->create('video2.mp4', 5000, 'video/mp4');

        $video1 = new Video(['status' => Video::STATUS_COMPLETED]);
        $video1->id = 1;

        $video2 = new Video(['status' => Video::STATUS_COMPLETED]);
        $video2->id = 2;

        $this->repository->shouldReceive('create')->twice()->andReturn($video1, $video2);

        $this->fileService->shouldReceive('uploadFile')->twice()->andReturn([
            'filename' => 'uuid_123.mp4',
            'original_filename' => 'video.mp4',
            'path' => 'videos/uuid_123.mp4',
            'url' => 'https://r2.example.com/videos/uuid_123.mp4',
            'cdn_url' => 'https://cdn.example.com/videos/uuid_123.mp4',
            'mime_type' => 'video/mp4',
            'size' => 5120000,
        ]);

        $this->repository->shouldReceive('update')->twice()->andReturn($video1, $video2);

        $result = $this->service->uploadMultipleVideos([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
    }

    public function test_should_remove_from_storage_and_database_on_delete_video(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1);

        $this->assertTrue($result);
    }

    public function test_should_force_delete_when_flag_is_true_on_delete_video(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(false);

        $this->repository->shouldReceive('forceDelete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1, forceDelete: true);

        $this->assertTrue($result);
    }

    public function test_should_throw_exception_when_not_found_on_delete_video(): void
    {
        $this->repository->shouldReceive('findOrFail')->with(999)
            ->andThrow(new \Illuminate\Database\Eloquent\ModelNotFoundException);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->service->deleteVideo(999);
    }

    public function test_should_also_delete_thumbnail_on_delete_video(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => 'thumbnails/test.jpg',
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->fileService->shouldReceive('deleteFile')
            ->with('thumbnails/test.jpg')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $this->service->deleteVideo(1);
    }

    public function test_should_return_video_from_repository_on_get_video(): void
    {
        $video = new Video();
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideo(1);

        $this->assertInstanceOf(Video::class, $result);
        $this->assertEquals(1, $result->id);
    }

    public function test_should_return_null_when_not_found_on_get_video(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideo(999));
    }

    public function test_should_return_cdn_url_on_get_video_cdn_url(): void
    {
        $video = new Video(['cdn_url' => 'https://cdn.example.com/videos/test.mp4']);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideoCdnUrl(1);

        $this->assertEquals('https://cdn.example.com/videos/test.mp4', $result);
    }

    public function test_should_return_null_when_not_found_on_get_video_cdn_url(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideoCdnUrl(999));
    }

    public function test_should_merge_with_existing_metadata_on_update_metadata(): void
    {
        $video = new Video(['metadata' => ['key1' => 'value1']]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1', 'key2' => 'value2']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $id === 1
                    && $data['metadata'] === ['key1' => 'value1', 'key2' => 'value2'];
            })
            ->andReturn($updatedVideo);

        $result = $this->service->updateMetadata(1, ['key2' => 'value2']);

        $this->assertEquals(['key1' => 'value1', 'key2' => 'value2'], $result->metadata);
    }

    public function test_should_handle_null_existing_metadata_on_update_metadata(): void
    {
        $video = new Video(['metadata' => null]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('findOrFail')->with(1)->andReturn($video);
        $this->repository
            ->shouldReceive('update')
            ->once()
            ->withArgs(function ($id, $data) {
                return $data['metadata'] === ['key1' => 'value1'];
            })
            ->andReturn($updatedVideo);

        $result = $this->service->updateMetadata(1, ['key1' => 'value1']);

        $this->assertEquals(['key1' => 'value1'], $result->metadata);
    }

    public function test_should_throw_exception_when_not_found_on_update_metadata(): void
    {
        $this->repository->shouldReceive('findOrFail')->with(999)
            ->andThrow(new \Illuminate\Database\Eloquent\ModelNotFoundException);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);

        $this->service->updateMetadata(999, ['key' => 'value']);
    }

    public function test_should_delegate_to_repository_on_get_all_videos(): void
    {
        $paginator = $this->mock(\Illuminate\Contracts\Pagination\LengthAwarePaginator::class);

        $this->repository->shouldReceive('paginate')->with(20)->once()->andReturn($paginator);

        $result = $this->service->getAllVideos(20);

        $this->assertSame($paginator, $result);
    }

    public function test_should_store_locally_and_dispatch_job_on_dispatch_upload(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video([
            'filename' => 'video.mp4',
            'status' => Video::STATUS_PENDING,
        ]);
        $pendingVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->withArgs(function ($data) {
                return $data['original_filename'] === 'video.mp4'
                    && $data['status'] === Video::STATUS_PENDING;
            })
            ->andReturn($pendingVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $result = $this->service->dispatchUpload($file);

        $this->assertIsArray($result);
        $this->assertEquals(Video::STATUS_PENDING, $result['status']);
        $this->assertEquals('video.mp4', $result['filename']);

        Queue::assertPushed(ProcessVideoUpload::class, function ($job) {
            return $job->videoId === 1
                && $job->directory === 'videos'
                && $job->originalFilename === 'video.mp4';
        });
    }

    public function test_should_dispatch_multiple_jobs_on_dispatch_multiple_uploads(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file1 = UploadedFile::fake()->create('video1.mp4', 5000, 'video/mp4');
        $file2 = UploadedFile::fake()->create('video2.mp4', 5000, 'video/mp4');

        $video1 = new Video(['status' => Video::STATUS_PENDING]);
        $video1->id = 1;

        $video2 = new Video(['status' => Video::STATUS_PENDING]);
        $video2->id = 2;

        $this->repository->shouldReceive('create')->twice()->andReturn($video1, $video2);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->twice();

        $result = $this->service->dispatchMultipleUploads([$file1, $file2]);

        $this->assertEquals(2, $result['queued']);
        $this->assertCount(2, $result['videos']);

        Queue::assertPushed(ProcessVideoUpload::class, 2);
    }

    public function test_should_create_video_with_pending_status_on_dispatch_upload(): void
    {
        Queue::fake();
        Storage::fake('local');

        $file = UploadedFile::fake()->create('video.mp4', 5000, 'video/mp4');

        $pendingVideo = new Video(['status' => Video::STATUS_PENDING]);
        $pendingVideo->id = 1;

        $this->repository
            ->shouldReceive('create')
            ->once()
            ->withArgs(function ($data) {
                return $data['status'] === Video::STATUS_PENDING
                    && $data['path'] === ''
                    && $data['mime_type'] === 'video/mp4';
            })
            ->andReturn($pendingVideo);

        Log::shouldReceive('channel')->with('dated')->andReturnSelf();
        Log::shouldReceive('info')->once();

        $this->service->dispatchUpload($file);
    }
}
