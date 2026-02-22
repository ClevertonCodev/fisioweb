<?php

namespace Modules\Pdf\Services;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Response;

class PdfService
{
    /**
     * Gera o PDF de uma Blade view e força o download no browser.
     *
     * @param  string  $view      Nome da view Blade (ex: 'pdf.clinic.treatment-plan')
     * @param  array   $data      Dados passados para a view
     * @param  string  $filename  Nome do arquivo para download
     */
    public function download(string $view, array $data = [], string $filename = 'documento.pdf'): Response
    {
        return $this->build($view, $data)->download($filename);
    }

    /**
     * Gera o PDF de uma Blade view e exibe no browser (inline).
     */
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
