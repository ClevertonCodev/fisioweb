<?php

namespace Modules\Media\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Services\PhotoService;
use Tests\TestCase;

class PhotoServiceTest extends TestCase
{
    protected FileServiceInterface $fileService;

    protected PhotoService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.image_directory' => 'images']);
        config(['cloudflare.thumbnail_directory' => 'thumbnails']);

        $this->fileService = $this->mock(FileServiceInterface::class);
        $this->service = new PhotoService($this->fileService);
    }

    public function testShouldUploadImageDelegateToFileServiceWithDefaultDirectory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg', 100, 'image/jpeg');

        $expected = [
            'filename' => 'uuid_123.jpg',
            'original_filename' => 'avatar.jpg',
            'path' => 'images/uuid_123.jpg',
            'url' => 'https://r2.example.com/images/uuid_123.jpg',
            'cdn_url' => 'https://cdn.example.com/images/uuid_123.jpg',
            'mime_type' => 'image/jpeg',
            'size' => 102400,
        ];

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'images')
            ->andReturn($expected);

        $result = $this->service->uploadImage($file);

        $this->assertEquals($expected, $result);
    }

    public function testShouldUploadImageAcceptCustomDirectory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg');

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'profile-photos')
            ->andReturn(['path' => 'profile-photos/uuid.jpg']);

        $result = $this->service->uploadImage($file, 'profile-photos');

        $this->assertEquals('profile-photos/uuid.jpg', $result['path']);
    }

    public function testShouldUploadThumbnailDelegateToFileServiceWithDefaultDirectory(): void
    {
        $file = UploadedFile::fake()->create('thumb.jpg');

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'thumbnails')
            ->andReturn(['path' => 'thumbnails/uuid.jpg']);

        $result = $this->service->uploadThumbnail($file);

        $this->assertEquals('thumbnails/uuid.jpg', $result['path']);
    }

    public function testShouldUploadThumbnailAcceptCustomDirectory(): void
    {
        $file = UploadedFile::fake()->create('thumb.jpg');

        $this->fileService
            ->shouldReceive('uploadFile')
            ->once()
            ->with($file, 'video-thumbs')
            ->andReturn(['path' => 'video-thumbs/uuid.jpg']);

        $result = $this->service->uploadThumbnail($file, 'video-thumbs');

        $this->assertEquals('video-thumbs/uuid.jpg', $result['path']);
    }

    public function testShouldUploadMultipleImagesDelegateToFileService(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');
        $file2 = UploadedFile::fake()->create('photo2.jpg');

        $this->fileService
            ->shouldReceive('uploadMultipleFiles')
            ->once()
            ->with([$file1, $file2], 'images')
            ->andReturn([
                'success' => [['path' => 'images/1.png'], ['path' => 'images/2.jpg']],
                'errors' => [],
            ]);

        $result = $this->service->uploadMultipleImages([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
    }

    public function testShouldThrowNotImplementedForCrudMethods(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->deleteImage(1);
    }

    public function testShouldThrowNotImplementedForGetImage(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->getImage(1);
    }

    public function testShouldThrowNotImplementedForGetAllImages(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('não implementado');

        $this->service->getAllImages();
    }
}
