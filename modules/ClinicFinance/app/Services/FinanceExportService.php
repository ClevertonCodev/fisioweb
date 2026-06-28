<?php

namespace Modules\ClinicFinance\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\ClinicFinance\Contracts\FinanceExportServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Services\Export\FinanceCsvExporter;
use Modules\ClinicFinance\Services\Export\FinancePdfExporter;
use Modules\ClinicFinance\Services\Export\FinanceXlsxExporter;
use Symfony\Component\HttpFoundation\Response;

class FinanceExportService implements FinanceExportServiceInterface
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $transactions,
        protected FinanceCsvExporter $csvExporter,
        protected FinanceXlsxExporter $xlsxExporter,
        protected FinancePdfExporter $pdfExporter,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public function export(int $clinicId, array $validated): Response
    {
        $range        = $this->resolveRange($clinicId, $validated);
        $transactions = $this->transactions->listForExport($clinicId, $range);

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'intervalo sem transações para exportar',
            ], 422);
        }

        $filename = 'financas-' . now()->format('Y-m-d');

        return match ($validated['format']) {
            'csv'   => $this->csvExporter->export($transactions, "{$filename}.csv"),
            'xlsx'  => $this->xlsxExporter->export($transactions, "{$filename}.xlsx"),
            'pdf'   => $this->pdfExporter->export($transactions, "{$filename}.pdf"),
            default => response()->json(['message' => 'Formato inválido.'], 422),
        };
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array{from: string, to: string}
     */
    private function resolveRange(int $clinicId, array $validated): array
    {
        $timezone = DB::table('clinics')->where('id', $clinicId)->value('timezone') ?? config('app.timezone');
        $now      = Carbon::now($timezone);

        return match ($validated['range']) {
            'current_month'  => [
                'from' => $now->copy()->startOfMonth()->toDateString(),
                'to'   => $now->copy()->endOfMonth()->toDateString(),
            ],
            'previous_month' => [
                'from' => $now->copy()->subMonth()->startOfMonth()->toDateString(),
                'to'   => $now->copy()->subMonth()->endOfMonth()->toDateString(),
            ],
            'custom' => [
                'from' => Carbon::parse($validated['from'])->toDateString(),
                'to'   => Carbon::parse($validated['to'])->toDateString(),
            ],
        };
    }
}
