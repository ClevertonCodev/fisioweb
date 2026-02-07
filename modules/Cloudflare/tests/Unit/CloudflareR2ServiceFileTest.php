<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Cloudflare\Services\CloudflareR2Service;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\TestCase;

class CloudflareR2ServiceFileTest extends TestCase
{
    protected CloudflareR2Service $service;

    protected function setUp(): void
    {
        parent::setUp();

        config(['cloudflare.r2_disk' => 'r2']);
        config(['cloudflare.cdn_url' => 'https://cdn.example.com']);
        config(['cloudflare.image_directory' => 'images']);
        config(['cloudflare.thumbnail_directory' => 'thumbnails']);

        Storage::fake('r2');

        $this->service = new CloudflareR2Service();
    }

    // ──────────────────────────────────────────────
    // uploadFile
    // ──────────────────────────────────────────────

    #[Test]
    public function upload_file_stores_file_and_returns_data(): void
    {
        $file = UploadedFile::fake()->create('photo.png', 100, 'image/png');

        $result = $this->service->uploadFile($file, 'files');

        $this->assertArrayHasKey('filename', $result);
        $this->assertArrayHasKey('original_filename', $result);
        $this->assertArrayHasKey('path', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertArrayHasKey('cdn_url', $result);
        $this->assertArrayHasKey('mime_type', $result);
        $this->assertArrayHasKey('size', $result);

        $this->assertEquals('photo.png', $result['original_filename']);
        $this->assertStringStartsWith('files/', $result['path']);
        $this->assertStringContainsString('cdn.example.com', $result['cdn_url']);

        Storage::disk('r2')->assertExists($result['path']);
    }

    #[Test]
    public function upload_file_generates_unique_filename(): void
    {
        $file = UploadedFile::fake()->create('photo.png');

        $result = $this->service->uploadFile($file);

        $this->assertNotEquals('photo.png', $result['filename']);
        $this->assertStringEndsWith('.png', $result['filename']);
    }

    #[Test]
    public function upload_file_uses_custom_directory(): void
    {
        $file = UploadedFile::fake()->create('photo.jpg');

        $result = $this->service->uploadFile($file, 'custom/path');

        $this->assertStringStartsWith('custom/path/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    #[Test]
    public function upload_file_throws_exception_on_storage_failure(): void
    {
        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')->once()->andReturn(false);

        Log::shouldReceive('error')->once();

        $file = UploadedFile::fake()->create('photo.png');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Failed to upload file');

        $this->service->uploadFile($file);
    }

    #[Test]
    public function upload_file_logs_success(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'File uploaded successfully'
                    && isset($context['path']);
            });

        $file = UploadedFile::fake()->create('photo.png');

        $this->service->uploadFile($file);
    }

    // ──────────────────────────────────────────────
    // uploadMultipleFiles
    // ──────────────────────────────────────────────

    #[Test]
    public function upload_multiple_files_returns_success_and_errors(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');
        $file2 = UploadedFile::fake()->create('photo2.jpg');

        $result = $this->service->uploadMultipleFiles([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
        $this->assertEquals('photo1.png', $result['success'][0]['original_filename']);
        $this->assertEquals('photo2.jpg', $result['success'][1]['original_filename']);
    }

    #[Test]
    public function upload_multiple_files_captures_individual_errors(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');

        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')
            ->once()
            ->andReturn(false);

        Log::shouldReceive('error')->once();

        $result = $this->service->uploadMultipleFiles([$file1]);

        $this->assertCount(0, $result['success']);
        $this->assertCount(1, $result['errors']);
        $this->assertEquals('photo1.png', $result['errors'][0]['file']);
    }

    // ──────────────────────────────────────────────
    // uploadImage
    // ──────────────────────────────────────────────

    #[Test]
    public function upload_image_uses_default_image_directory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg');

        $result = $this->service->uploadImage($file);

        $this->assertStringStartsWith('images/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    #[Test]
    public function upload_image_accepts_custom_directory(): void
    {
        $file = UploadedFile::fake()->create('avatar.jpg');

        $result = $this->service->uploadImage($file, 'profile-photos');

        $this->assertStringStartsWith('profile-photos/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    // ──────────────────────────────────────────────
    // uploadThumbnail
    // ──────────────────────────────────────────────

    #[Test]
    public function upload_thumbnail_uses_default_thumbnail_directory(): void
    {
        $file = UploadedFile::fake()->create('thumb.jpg');

        $result = $this->service->uploadThumbnail($file);

        $this->assertStringStartsWith('thumbnails/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    #[Test]
    public function upload_thumbnail_accepts_custom_directory(): void
    {
        $file = UploadedFile::fake()->create('thumb.jpg');

        $result = $this->service->uploadThumbnail($file, 'video-thumbs');

        $this->assertStringStartsWith('video-thumbs/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    // ──────────────────────────────────────────────
    // deleteFile
    // ──────────────────────────────────────────────

    #[Test]
    public function delete_file_removes_existing_file(): void
    {
        $file = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        Storage::disk('r2')->assertExists($result['path']);

        $deleted = $this->service->deleteFile($result['path']);

        $this->assertTrue($deleted);
        Storage::disk('r2')->assertMissing($result['path']);
    }

    #[Test]
    public function delete_file_returns_false_when_file_not_found(): void
    {
        $result = $this->service->deleteFile('non-existent/file.png');

        $this->assertFalse($result);
    }

    // ──────────────────────────────────────────────
    // fileExists
    // ──────────────────────────────────────────────

    #[Test]
    public function file_exists_returns_true_for_existing_file(): void
    {
        $file = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        $this->assertTrue($this->service->fileExists($result['path']));
    }

    #[Test]
    public function file_exists_returns_false_for_missing_file(): void
    {
        $this->assertFalse($this->service->fileExists('non-existent/file.png'));
    }

    // ──────────────────────────────────────────────
    // getFileUrl / getFileCdnUrl
    // ──────────────────────────────────────────────

    #[Test]
    public function get_file_cdn_url_returns_cdn_url_for_path(): void
    {
        $url = $this->service->getFileCdnUrl('images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }

    #[Test]
    public function get_file_cdn_url_handles_leading_slash(): void
    {
        $url = $this->service->getFileCdnUrl('/images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }
}
