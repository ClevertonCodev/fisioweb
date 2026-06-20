<?php

namespace Modules\Clinic\Services\Export;

use Illuminate\Support\Collection;
use Modules\Pdf\Services\PdfService;
use Symfony\Component\HttpFoundation\Response;

class FinancePdfExporter
{
    public function __construct(
        protected PdfService $pdfService,
    ) {}

    /**
     * @param  Collection<int, object>  $transactions
     */
    public function export(Collection $transactions, string $filename = 'financas.pdf'): Response
    {
        return $this->pdfService->download(
            'clinic::finance.export-transactions',
            ['transactions' => $transactions],
            $filename,
        );
    }
}
