<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

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
