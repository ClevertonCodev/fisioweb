<?php

namespace Modules\ClinicFinance\Services\Export;

use Illuminate\Support\Collection;
use Modules\Pdf\Contracts\PdfGeneratorInterface;
use Symfony\Component\HttpFoundation\Response;

class FinancePdfExporter
{
    public function __construct(
        protected PdfGeneratorInterface $pdfGenerator,
    ) {}

    /**
     * @param  Collection<int, object>  $transactions
     */
    public function export(Collection $transactions, string $filename = 'financas.pdf'): Response
    {
        return $this->pdfGenerator->download(
            'clinic::finance.export-transactions',
            ['transactions' => $transactions],
            $filename,
        );
    }
}
