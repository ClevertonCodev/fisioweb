<?php

namespace Modules\Cloudflare\Tests\Unit;

use Illuminate\Support\Facades\Log;
use Mockery;
use Modules\Cloudflare\Contracts\SignedMediaUrlInterface;
use Modules\Cloudflare\Services\CloudflareR2Service;
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

        $signer = new SignedMediaUrlService;
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
        $files = Mockery::mock(CloudflareR2Service::class);
        $files->shouldReceive('createPresignedDownloadUrl')->andThrow(new RuntimeException('credencial inválida'));
        Log::spy();

        $signer = new SignedMediaUrlService($files);

        $this->assertNull($signer->forImage('patients/photos/foto-sigilosa.jpg'));
        $this->assertNull($signer->forVideo('videos/aula.mp4'));
        Log::shouldHaveReceived('error')->twice()->withArgs(
            fn (string $message, array $context = []) => !str_contains($message . json_encode($context), 'foto-sigilosa'),
        );
    }
}
