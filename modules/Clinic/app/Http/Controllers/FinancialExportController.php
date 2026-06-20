<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Http\Requests\ExportFinancialTransactionsRequest;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\FinancialTransaction;
use Modules\Clinic\Services\Export\FinanceCsvExporter;
use Modules\Clinic\Services\Export\FinancePdfExporter;
use Modules\Clinic\Services\Export\FinanceXlsxExporter;

class FinancialExportController extends Controller
{
    public function __construct(
        protected FinanceCsvExporter $csvExporter,
        protected FinanceXlsxExporter $xlsxExporter,
        protected FinancePdfExporter $pdfExporter,
    ) {}

    public function export(ExportFinancialTransactionsRequest $request)
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $range    = $this->resolveRange($clinicId, $request->validated());

        $transactions = FinancialTransaction::query()
            ->forClinic($clinicId)
            ->with('category')
            ->whereBetween('date', [$range['from'], $range['to']])
            ->orderBy('date')
            ->get();

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'intervalo sem transações para exportar',
            ], 422);
        }

        $filename = 'financas-' . now()->format('Y-m-d');
        $format   = $request->validated('format');

        return match ($format) {
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
        $clinic   = Clinic::findOrFail($clinicId);
        $timezone = $clinic->timezone ?? config('app.timezone');
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
