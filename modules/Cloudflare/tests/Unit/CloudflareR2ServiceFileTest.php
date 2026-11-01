<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Modules\Cloudflare\Services\CloudflareR2Service;
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

        $this->service = new CloudflareR2Service;
    }

    public function test_should_store_file_and_return_data_on_upload_file(): void
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

    public function test_should_generate_unique_filename_on_upload_file(): void
    {
        $file = UploadedFile::fake()->create('photo.png');

        $result = $this->service->uploadFile($file);

        $this->assertNotEquals('photo.png', $result['filename']);
        $this->assertStringEndsWith('.png', $result['filename']);
    }

    public function test_should_use_custom_directory_on_upload_file(): void
    {
        $file = UploadedFile::fake()->create('photo.jpg');

        $result = $this->service->uploadFile($file, 'custom/path');

        $this->assertStringStartsWith('custom/path/', $result['path']);
        Storage::disk('r2')->assertExists($result['path']);
    }

    public function test_should_throw_exception_on_storage_failure_on_upload_file(): void
    {
        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')->once()->andReturn(false);

        Log::shouldReceive('error')->once();

        $file = UploadedFile::fake()->create('photo.png');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Failed to upload file');

        $this->service->uploadFile($file);
    }

    public function test_should_log_success_on_upload_file(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function ($message, $context) {
                return $message === 'Arquivo uploadado com sucesso'
                    && isset($context['path']);
            });

        $file = UploadedFile::fake()->create('photo.png');

        $this->service->uploadFile($file);
    }

    public function test_upload_file_as_stores_under_the_given_name_and_never_trusts_the_client_extension(): void
    {
        $file = UploadedFile::fake()->createWithContent('x.html', "%PDF-1.4\n<script>alert(1)</script>");

        $result = $this->service->uploadFileAs($file, 'clinics/7/finances/transactions/3', 'abc.pdf', 'application/pdf');

        $this->assertSame('clinics/7/finances/transactions/3/abc.pdf', $result['path']);
        $this->assertSame('abc.pdf', $result['filename']);
        $this->assertSame('x.html', $result['original_filename']);
        $this->assertSame('application/pdf', $result['mime_type']);
        $this->assertArrayNotHasKey('cdn_url', $result);
        $this->assertArrayNotHasKey('url', $result);
        Storage::disk('r2')->assertExists('clinics/7/finances/transactions/3/abc.pdf');
    }

    public function test_upload_file_as_sends_the_content_type_explicitly_and_does_not_log_the_path(): void
    {
        Log::spy();
        $file = UploadedFile::fake()->createWithContent('x.html', "%PDF-1.4\n<script>alert(1)</script>");

        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')
            ->once()
            ->with('clinics/7/finances/transactions/3', $file, 'abc.pdf', \Mockery::on(
                fn ($options) => is_array($options) && ($options['ContentType'] ?? null) === 'application/pdf',
            ))
            ->andReturn('clinics/7/finances/transactions/3/abc.pdf');

        $this->service->uploadFileAs($file, 'clinics/7/finances/transactions/3', 'abc.pdf', 'application/pdf');

        Log::shouldNotHaveReceived('info');
    }

    public function test_upload_file_as_failure_does_not_log_the_file_name(): void
    {
        $logged = [];
        Log::shouldReceive('error')->once()->andReturnUsing(function ($message, $context) use (&$logged) {
            $logged = $context;
        });
        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('putFileAs')->once()->andReturn(false);

        try {
            $this->service->uploadFileAs(UploadedFile::fake()->create('r.pdf'), 'clinics/7/finances/transactions/3', 'segredo.pdf', 'application/pdf');
            $this->fail('Devia lançar RuntimeException.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Failed to upload file', $e->getMessage());
        }

        $this->assertStringNotContainsString('segredo', json_encode($logged));
    }

    public function test_should_return_success_and_errors_on_upload_multiple_files(): void
    {
        $file1 = UploadedFile::fake()->create('photo1.png');
        $file2 = UploadedFile::fake()->create('photo2.jpg');

        $result = $this->service->uploadMultipleFiles([$file1, $file2]);

        $this->assertCount(2, $result['success']);
        $this->assertCount(0, $result['errors']);
        $this->assertEquals('photo1.png', $result['success'][0]['original_filename']);
        $this->assertEquals('photo2.jpg', $result['success'][1]['original_filename']);
    }

    public function test_should_capture_individual_errors_on_upload_multiple_files(): void
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

    public function test_should_remove_existing_file_on_delete_file(): void
    {
        $file   = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        Storage::disk('r2')->assertExists($result['path']);

        $deleted = $this->service->deleteFile($result['path']);

        $this->assertTrue($deleted);
        Storage::disk('r2')->assertMissing($result['path']);
    }

    public function test_should_return_false_when_file_not_found_on_delete_file(): void
    {
        $result = $this->service->deleteFile('non-existent/file.png');

        $this->assertFalse($result);
    }

    public function test_delete_private_file_removes_the_file_and_logs_only_the_folder(): void
    {
        $this->service->uploadFileAs(UploadedFile::fake()->create('r.pdf'), 'clinics/7/finances/transactions/3', 'segredo.pdf', 'application/pdf');
        $logged = [];
        Log::shouldReceive('info')->andReturnUsing(function ($message, $context = []) use (&$logged) {
            $logged[] = [$message, $context];
        });

        $this->assertTrue($this->service->deletePrivateFile('clinics/7/finances/transactions/3/segredo.pdf'));

        Storage::disk('r2')->assertMissing('clinics/7/finances/transactions/3/segredo.pdf');
        $this->assertNotEmpty($logged);
        $this->assertStringNotContainsString('segredo', json_encode($logged));
        $this->assertFalse($this->service->deletePrivateFile('clinics/7/finances/transactions/3/segredo.pdf'));
    }

    public function test_delete_private_file_failure_does_not_carry_the_file_name(): void
    {
        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('exists')->once()->andThrow(new \RuntimeException('Unable to check existence for: clinics/7/finances/transactions/3/segredo.pdf'));

        try {
            $this->service->deletePrivateFile('clinics/7/finances/transactions/3/segredo.pdf');
            $this->fail('Devia lançar RuntimeException.');
        } catch (\RuntimeException $e) {
            // O report() de quem chama registra a exceção e as anteriores: nenhuma leva o nome.
            $this->assertStringNotContainsString('segredo', $e->getMessage());
            $this->assertNull($e->getPrevious());
        }
    }

    public function test_should_return_true_for_existing_file_on_file_exists(): void
    {
        $file   = UploadedFile::fake()->create('photo.png');
        $result = $this->service->uploadFile($file);

        $this->assertTrue($this->service->fileExists($result['path']));
    }

    public function test_should_return_false_for_missing_file_on_file_exists(): void
    {
        $this->assertFalse($this->service->fileExists('non-existent/file.png'));
    }

    public function test_should_return_cdn_url_for_path_on_get_file_cdn_url(): void
    {
        $url = $this->service->getFileCdnUrl('images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }

    public function test_should_handle_leading_slash_on_get_file_cdn_url(): void
    {
        $url = $this->service->getFileCdnUrl('/images/photo.png');

        $this->assertEquals('https://cdn.example.com/images/photo.png', $url);
    }

    public function test_should_upload_from_local_path_and_return_data(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test_');
        rename($tempFile, $tempFile . '.mp4');
        $tempFile = $tempFile . '.mp4';
        file_put_contents($tempFile, 'fake video content');

        try {
            $result = $this->service->uploadFromPath($tempFile, 'videos', 'original.mp4');

            $this->assertArrayHasKey('filename', $result);
            $this->assertArrayHasKey('original_filename', $result);
            $this->assertArrayHasKey('path', $result);
            $this->assertArrayHasKey('url', $result);
            $this->assertArrayHasKey('cdn_url', $result);
            $this->assertArrayHasKey('mime_type', $result);
            $this->assertArrayHasKey('size', $result);

            $this->assertEquals('original.mp4', $result['original_filename']);
            $this->assertStringStartsWith('videos/', $result['path']);
            $this->assertStringEndsWith('.mp4', $result['filename']);
            $this->assertStringContainsString('cdn.example.com', $result['cdn_url']);

            Storage::disk('r2')->assertExists($result['path']);
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    public function test_should_use_basename_when_no_original_filename_on_upload_from_path(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test_');
        rename($tempFile, $tempFile . '.png');
        $tempFile = $tempFile . '.png';
        file_put_contents($tempFile, 'fake content');

        try {
            $result = $this->service->uploadFromPath($tempFile, 'files');

            $this->assertEquals(basename($tempFile), $result['original_filename']);
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }

    public function test_should_throw_exception_when_file_not_found_on_upload_from_path(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('File not found at path');

        $this->service->uploadFromPath('/non/existent/file.mp4', 'videos');
    }

    public function test_should_throw_exception_on_storage_failure_on_upload_from_path(): void
    {
        $tempFile = tempnam(sys_get_temp_dir(), 'test_');
        file_put_contents($tempFile, 'fake content');

        Storage::shouldReceive('disk')->with('r2')->andReturnSelf();
        Storage::shouldReceive('put')->once()->andReturn(false);

        Log::shouldReceive('error')->once();

        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('Failed to upload file');

            $this->service->uploadFromPath($tempFile, 'videos');
        } finally {
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
        }
    }
}
