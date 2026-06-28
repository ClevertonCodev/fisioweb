<?php

namespace Modules\Pdf\Contracts;

use Illuminate\Http\Response;

interface PdfGeneratorInterface
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function download(string $view, array $data = [], string $filename = 'documento.pdf'): Response;

    /**
     * @param  array<string, mixed>  $data
     */
    public function stream(string $view, array $data = [], string $filename = 'documento.pdf'): Response;
}
