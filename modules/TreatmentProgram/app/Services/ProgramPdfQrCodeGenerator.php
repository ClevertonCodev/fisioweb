<?php

namespace Modules\TreatmentProgram\Services;

/**
 * Gera URL/imagem de QR para embutir no DomPDF.
 *
 * Preferência: pacote chillerlan/php-qrcode (data-URI PNG) quando instalado.
 * Fallback: API pública de QR (DomPDF com isRemoteEnabled carrega a imagem).
 *
 * Para instalar o pacote localmente: composer require chillerlan/php-qrcode:^5.0
 */
class ProgramPdfQrCodeGenerator
{
    public function imageSrc(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        if (class_exists(\chillerlan\QRCode\QRCode::class)) {
            try {
                $options = new \chillerlan\QRCode\QROptions([
                    'outputType' => \chillerlan\QRCode\QRCode::OUTPUT_IMAGE_PNG,
                    'scale'      => 5,
                ]);
                $png = (new \chillerlan\QRCode\QRCode($options))->render($url);

                return $png;
            } catch (\Throwable) {
                // fallback abaixo
            }
        }

        return 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' . rawurlencode($url);
    }
}
