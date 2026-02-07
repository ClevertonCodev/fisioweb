<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Models\Video;
use Modules\Cloudflare\Repositories\VideoRepository;
use Modules\Cloudflare\Services\VideoService;
use PHPUnit\Framework\Attributes\Test;
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

    #[Test]
    public function upload_video_creates_record_and_uploads_to_storage(): void
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

        Log::shouldReceive('info')->once();

        $result = $this->service->uploadVideo($file);

        $this->assertInstanceOf(Video::class, $result);
        $this->assertEquals(Video::STATUS_COMPLETED, $result->status);
    }

    #[Test]
    public function upload_video_marks_as_failed_when_storage_fails(): void
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

        Log::shouldReceive('error')->once();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Failed to upload video');

        $this->service->uploadVideo($file);
    }

    #[Test]
    public function upload_multiple_videos_returns_success_and_errors(): void
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
        Log::shouldReceive('info')->twice();

        $result = $this->service->uploadMultipleVideos([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
    }

    #[Test]
    public function delete_video_removes_from_storage_and_database(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1);

        $this->assertTrue($result);
    }

    #[Test]
    public function delete_video_force_deletes_when_flag_is_true(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => null,
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(false);

        $this->repository->shouldReceive('forceDelete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('info')->once();

        $result = $this->service->deleteVideo(1, forceDelete: true);

        $this->assertTrue($result);
    }

    #[Test]
    public function delete_video_throws_exception_when_not_found(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Video with ID 999 not found');

        $this->service->deleteVideo(999);
    }

    #[Test]
    public function delete_video_also_deletes_thumbnail(): void
    {
        $video = new Video([
            'path' => 'videos/test.mp4',
            'thumbnail_path' => 'thumbnails/test.jpg',
        ]);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $this->fileService->shouldReceive('deleteFile')
            ->with('videos/test.mp4')
            ->once()
            ->andReturn(true);

        $this->fileService->shouldReceive('deleteFile')
            ->with('thumbnails/test.jpg')
            ->once()
            ->andReturn(true);

        $this->repository->shouldReceive('delete')->with(1)->once()->andReturn(true);

        Log::shouldReceive('info')->once();

        $this->service->deleteVideo(1);
    }

    #[Test]
    public function get_video_returns_video_from_repository(): void
    {
        $video = new Video();
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideo(1);

        $this->assertInstanceOf(Video::class, $result);
        $this->assertEquals(1, $result->id);
    }

    #[Test]
    public function get_video_returns_null_when_not_found(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideo(999));
    }

    #[Test]
    public function get_video_cdn_url_returns_cdn_url(): void
    {
        $video = new Video(['cdn_url' => 'https://cdn.example.com/videos/test.mp4']);
        $video->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);

        $result = $this->service->getVideoCdnUrl(1);

        $this->assertEquals('https://cdn.example.com/videos/test.mp4', $result);
    }

    #[Test]
    public function get_video_cdn_url_returns_null_when_not_found(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->assertNull($this->service->getVideoCdnUrl(999));
    }

    #[Test]
    public function update_metadata_merges_with_existing_metadata(): void
    {
        $video = new Video(['metadata' => ['key1' => 'value1']]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1', 'key2' => 'value2']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);
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

    #[Test]
    public function update_metadata_handles_null_existing_metadata(): void
    {
        $video = new Video(['metadata' => null]);
        $video->id = 1;

        $updatedVideo = new Video(['metadata' => ['key1' => 'value1']]);
        $updatedVideo->id = 1;

        $this->repository->shouldReceive('find')->with(1)->andReturn($video);
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

    #[Test]
    public function update_metadata_throws_exception_when_not_found(): void
    {
        $this->repository->shouldReceive('find')->with(999)->andReturn(null);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Video with ID 999 not found');

        $this->service->updateMetadata(999, ['key' => 'value']);
    }

    #[Test]
    public function get_all_videos_delegates_to_repository(): void
    {
        $paginator = $this->mock(\Illuminate\Contracts\Pagination\LengthAwarePaginator::class);

        $this->repository->shouldReceive('paginate')->with(20)->once()->andReturn($paginator);

        $result = $this->service->getAllVideos(20);

        $this->assertSame($paginator, $result);
    }
}
