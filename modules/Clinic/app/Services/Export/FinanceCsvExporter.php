<?php

namespace Modules\Clinic\Services\Export;

use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceCsvExporter
{
    /**
     * @param  Collection<int, object>  $transactions
     */
    public function export(Collection $transactions, string $filename = 'financas.csv'): StreamedResponse
    {
        return response()->streamDownload(function () use ($transactions) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $this->headers(), ';');

            foreach ($transactions as $row) {
                fputcsv($handle, $this->mapRow($row), ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    /**
     * @return list<string>
     */
    private function headers(): array
    {
        return ['Data', 'Descrição', 'Categoria', 'Tipo', 'Método', 'Valor bruto', 'Taxa', 'Valor líquido', 'Status'];
    }

    /**
     * @return list<string>
     */
    private function mapRow(object $transaction): array
    {
        return [
            $transaction->date instanceof \DateTimeInterface
                ? $transaction->date->format('d/m/Y')
                : (string) $transaction->date,
            $transaction->description,
            $transaction->category->name ?? '',
            $transaction->type->value ?? (string) $transaction->type,
            $transaction->payment_method->value ?? (string) $transaction->payment_method,
            number_format((float) $transaction->gross_amount, 2, ',', '.'),
            number_format((float) $transaction->fee_amount, 2, ',', '.'),
            number_format((float) $transaction->net_amount, 2, ',', '.'),
            $transaction->status->value ?? (string) $transaction->status,
        ];
    }
}
