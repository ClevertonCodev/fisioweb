<?php

namespace Modules\Pdf\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PdfService
{
    public function download(string $view, array $data = [], string $filename = 'documento.pdf'): Response
    {
        return $this->build($view, $data)->download($filename);
    }

    public function stream(string $view, array $data = [], string $filename = 'documento.pdf'): Response
    {
        return $this->build($view, $data)->stream($filename);
    }

    private function build(string $view, array $data): \Barryvdh\DomPDF\PDF
    {
        return Pdf::loadView($view, $data)
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled'    => true,
                'isRemoteEnabled'         => true,
                'defaultFont'             => 'DejaVu Sans',
                'dpi'                     => 150,
                'isFontSubsettingEnabled' => true,
            ]);
    }
}
