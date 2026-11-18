<?php

namespace Modules\TreatmentProgram\Services;

use Illuminate\Support\Facades\Log;

class ProgramPdfQrCodeGenerator
{
    public function imageSrc(?string $url): ?string
    {
        if (empty($url)) {
            return null;
        }

        try {
            $png = $this->renderLocal($url);
        } catch (\Throwable $e) {
            Log::warning('QR do programa não gerado', ['error' => $e::class]);

            return null;
        }

        if (empty($png)) {
            Log::warning('QR do programa não gerado');

            return null;
        }

        return $png;
    }

    protected function renderLocal(string $url): ?string
    {
        if (!class_exists(\chillerlan\QRCode\QRCode::class)) {
            return null;
        }

        $options = new \chillerlan\QRCode\QROptions([
            'outputType' => \chillerlan\QRCode\QRCode::OUTPUT_IMAGE_PNG,
            'scale'      => 5,
        ]);

        return (new \chillerlan\QRCode\QRCode($options))->render($url);
    }
}
