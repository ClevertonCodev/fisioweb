<?php

namespace Modules\ClinicFinance\Services\Export;

use Illuminate\Support\Collection;
use Modules\Xlsx\Services\XlsxService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceXlsxExporter
{
    public function __construct(
        protected XlsxService $xlsxService,
    ) {}

    /**
     * @param  Collection<int, object>  $transactions
     */
    public function export(Collection $transactions, string $filename = 'financas.xlsx'): StreamedResponse
    {
        $headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Método', 'Valor bruto', 'Taxa', 'Valor líquido', 'Status'];
        $rows    = [];

        foreach ($transactions as $transaction) {
            $rows[] = [
                $transaction->date instanceof \DateTimeInterface
                    ? $transaction->date->format('d/m/Y')
                    : (string) $transaction->date,
                $transaction->description,
                $transaction->category->name ?? '',
                $transaction->type->value ?? (string) $transaction->type,
                $transaction->payment_method->value ?? (string) $transaction->payment_method,
                (float) $transaction->gross_amount,
                (float) $transaction->fee_amount,
                (float) $transaction->net_amount,
                $transaction->status->value ?? (string) $transaction->status,
            ];
        }

        return $this->xlsxService->download($headers, $rows, $filename);
    }
}
