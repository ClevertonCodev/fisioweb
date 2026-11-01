<?php

namespace Modules\Cloudflare\Tests\Unit;

use Modules\Cloudflare\Services\CloudflareR2Service;
use Tests\TestCase;

/** Link de leitura assinado (comprovantes de Finanças): assinar é local, sem rede. */
class CloudflareR2PresignedDownloadTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'cloudflare.r2_disk'                => 'r2-presign-test',
            'cloudflare.cdn_url'                => 'https://cdn.example.com',
            'cloudflare.r2.bucket'              => 'bucket-teste',
            'filesystems.disks.r2-presign-test' => [
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

    public function test_creates_a_signed_get_link_that_expires_and_never_uses_the_cdn(): void
    {
        $this->travelTo(now()->setDate(2026, 10, 31)->setTime(12, 0));

        $link = (new CloudflareR2Service)->createPresignedDownloadUrl('clinics/7/finances/transactions/3/a.pdf', 300, 'Recibo março.pdf');

        $this->assertStringStartsWith('https://conta.r2.example.com/bucket-teste/clinics/7/finances/transactions/3/a.pdf?', $link['url']);
        $this->assertStringContainsString('X-Amz-Signature=', $link['url']);
        $this->assertStringContainsString('X-Amz-Expires=300', $link['url']);
        $this->assertStringContainsString('response-content-disposition=', $link['url']);
        $this->assertStringContainsString(rawurlencode(rawurlencode('Recibo março.pdf')), $link['url']);
        $this->assertStringNotContainsString('cdn.example.com', $link['url']);
        $this->assertSame(now()->addSeconds(300)->toISOString(), $link['expires_at']);
    }

    public function test_the_link_forces_the_stored_content_type_and_opens_inline_only_image_or_pdf(): void
    {
        $service = new CloudflareR2Service;

        $pdf = $service->createPresignedDownloadUrl('clinics/7/finances/transactions/3/a.pdf', 300, 'Recibo.pdf', 'application/pdf');
        $this->assertStringContainsString('response-content-type=' . rawurlencode('application/pdf'), $pdf['url']);
        $this->assertStringContainsString('response-content-disposition=inline', $pdf['url']);

        $photo = $service->createPresignedDownloadUrl('clinics/7/finances/transactions/3/a.heic', 300, 'Foto.heic', 'image/heic');
        $this->assertStringContainsString('response-content-type=' . rawurlencode('image/heic'), $photo['url']);
        $this->assertStringContainsString('response-content-disposition=inline', $photo['url']);

        // SVG é imagem que roda script: nunca abre inline.
        $svg = $service->createPresignedDownloadUrl('clinics/7/finances/transactions/3/a.svg', 300, 'x.svg', 'image/svg+xml');
        $this->assertStringContainsString('response-content-disposition=attachment', $svg['url']);

        $html = $service->createPresignedDownloadUrl('clinics/7/finances/transactions/3/a.bin', 300, 'x.html', 'text/html');
        $this->assertStringContainsString('response-content-disposition=attachment', $html['url']);
        $this->assertStringNotContainsString('response-content-disposition=inline', $html['url']);
    }
}
