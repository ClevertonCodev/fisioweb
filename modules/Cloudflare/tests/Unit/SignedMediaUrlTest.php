<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Support\Facades\Log;
use Mockery;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Contracts\SignedMediaUrlInterface;
use Modules\Cloudflare\Services\SignedMediaUrlService;
use RuntimeException;
use Tests\TestCase;

class SignedMediaUrlTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cloudflare.r2_disk'                     => 'r2-signed-media-test',
            'cloudflare.r2.bucket'                   => 'bucket-teste',
            'filesystems.disks.r2-signed-media-test' => [
                'driver'                  => 's3',
                'key'                     => 'chave',
                'secret'                  => 'segredo',
                'region'                  => 'auto',
                'bucket'                  => 'bucket-teste',
                'endpoint'                => 'https://conta.r2.example.com',
                'use_path_style_endpoint' => true,
            ],
        ]);
    }

    public function test_video_link_expires_in_thirty_minutes_and_image_link_in_five(): void
    {
        $this->travelTo(now()->setTime(12, 0));

        $signer = app(SignedMediaUrlInterface::class);
        $video  = $signer->forVideo('videos/aula.mp4');
        $image  = $signer->forImage('patients/photos/foto.jpg');

        $this->assertNotNull($video);
        $this->assertNotNull($image);
        $this->assertStringContainsString('X-Amz-Signature=', $video);
        $this->assertStringContainsString('X-Amz-Expires=1800', $video);
        $this->assertStringContainsString('X-Amz-Expires=300', $image);
        $this->assertSame(1800, SignedMediaUrlInterface::VIDEO_TTL_SECONDS);
        $this->assertSame(300, SignedMediaUrlInterface::IMAGE_TTL_SECONDS);
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $video);
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $image);
        $this->assertNull($signer->forVideo(null));
        $this->assertNull($signer->forVideo(''));
        $this->assertNull($signer->forImage(null));
    }

    public function test_a_signing_failure_returns_null_and_logs_without_the_path(): void
    {
        $files = Mockery::mock(FileServiceInterface::class);
        $files->shouldReceive('createPresignedDownloadUrl')->andThrow(new RuntimeException('credencial inválida'));
        Log::spy();

        $signer = new SignedMediaUrlService($files);

        $this->assertNull($signer->forImage('patients/photos/foto-sigilosa.jpg'));
        $this->assertNull($signer->forVideo('videos/aula.mp4'));
        Log::shouldHaveReceived('error')->twice()->withArgs(
            fn (string $message, array $context = []) => !str_contains($message . json_encode($context), 'foto-sigilosa'),
        );
    }

    public function test_the_same_file_gets_the_same_link_inside_the_window_and_a_new_one_after_it(): void
    {
        $signer = app(SignedMediaUrlInterface::class);

        $this->travelTo(now()->setTime(12, 0, 5));
        $first = $signer->forImage('covers/videos/capa.jpg');
        $this->travelTo(now()->setTime(12, 0, 55));
        $sameWindow = $signer->forImage('covers/videos/capa.jpg');
        $this->travelTo(now()->setTime(12, 1, 5));
        $nextWindow = $signer->forImage('covers/videos/capa.jpg');

        $this->assertSame($first, $sameWindow);
        $this->assertNotSame($first, $nextWindow);
        $this->assertStringContainsString('X-Amz-Date=20', $first);
        $this->assertStringContainsString('T120000Z', $first);
        $this->assertStringContainsString('X-Amz-Expires=300', $first);
    }

    public function test_signing_goes_through_the_file_service_from_the_container(): void
    {
        $this->travelTo(now()->setTime(12, 7, 30));
        $files = Mockery::mock(FileServiceInterface::class);
        $files->shouldReceive('createPresignedDownloadUrl')
            ->once()
            ->withArgs(fn (string $path, int $ttl, ?string $name, ?string $type, ?\DateTimeInterface $startsAt) => $path === 'videos/aula.mp4'
                && $ttl === 1800
                && $startsAt?->format('H:i:s') === '12:06:00')
            ->andReturn(['url' => 'https://assinado.example/videos/aula.mp4', 'expires_at' => '']);
        $this->app->instance(FileServiceInterface::class, $files);

        $this->assertSame('https://assinado.example/videos/aula.mp4', app(SignedMediaUrlInterface::class)->forVideo('videos/aula.mp4'));
    }
}
