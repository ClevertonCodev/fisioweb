<?php

namespace Tests;

use Closure;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Mockery;
use Mockery\MockInterface;
use Modules\Cloudflare\Contracts\FileServiceInterface;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cloudflare.r2_disk'   => 'r2',
            'cloudflare.r2.bucket' => 'bucket-teste',
            'filesystems.disks.r2' => [
                'driver'                  => 's3',
                'key'                     => 'chave',
                'secret'                  => 'segredo',
                'region'                  => 'auto',
                'bucket'                  => 'bucket-teste',
                'endpoint'                => 'https://conta.r2.example.com',
                'use_path_style_endpoint' => true,
                'throw'                   => false,
            ],
        ]);
    }

    /**
     * Troca o serviço de arquivos por um mock que, por padrão, assina links de leitura
     * de verdade, porque a mídia assinada passa pelo mesmo serviço.
     */
    protected function mockFiles(?Closure $setup = null): MockInterface
    {
        $real = $this->app->make(FileServiceInterface::class);
        $mock = Mockery::mock(FileServiceInterface::class);
        $mock->shouldReceive('createPresignedDownloadUrl')
            ->byDefault()
            ->andReturnUsing(fn (...$args) => $real->createPresignedDownloadUrl(...$args));
        if ($setup) {
            $setup($mock);
        }
        $this->app->instance(FileServiceInterface::class, $mock);

        return $mock;
    }

    protected function assertSignedVideoUrl(mixed $url, string $path): void
    {
        $this->assertIsString($url);
        $this->assertStringContainsString('X-Amz-Expires=1800', $url);
        $this->assertStringContainsString($path, $url);
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $url);
    }

    protected function assertSignedImageUrl(mixed $url, string $path): void
    {
        $this->assertIsString($url);
        $this->assertStringContainsString('X-Amz-Expires=300', $url);
        $this->assertStringContainsString($path, $url);
        $this->assertStringNotContainsString('cdn-dev.ivsmed.com', $url);
    }
}
