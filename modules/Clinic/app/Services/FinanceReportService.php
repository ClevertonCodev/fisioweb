<?php

namespace Modules\Clinic\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Modules\Clinic\Contracts\FinancialTransactionRepositoryInterface;
use Modules\Clinic\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\Clinic\Enums\FinancialTransactionType;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\FinancialTransaction;

class FinanceReportService
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $transactionRepository,
        protected PeriodOpeningBalanceRepositoryInterface $openingBalanceRepository,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function reportSummary(int $clinicId, array $filters = []): array
    {
        $period         = $filters['period'] ?? now()->format('Y-m');
        [$year, $month] = array_map('intval', explode('-', $period));

        $current        = $this->transactionRepository->aggregateSummary($clinicId, array_merge($filters, ['period' => $period]));
        $previousPeriod = Carbon::createFromDate($year, $month, 1)->subMonth()->format('Y-m');
        $previous       = $this->transactionRepository->aggregateSummary($clinicId, ['period' => $previousPeriod]);

        $income  = $current['received'] + $current['pending_income'];
        $expense = $current['paid'] + $current['pending_expense'];
        $balance = $income - $expense;

        $prevIncome  = $previous['received'] + $previous['pending_income'];
        $prevExpense = $previous['paid'] + $previous['pending_expense'];
        $prevBalance = $prevIncome - $prevExpense;

        return [
            'period' => ['year' => $year, 'month' => $month],
            'totals' => [
                'income'  => round($income, 2),
                'expense' => round($expense, 2),
                'balance' => round($balance, 2),
            ],
            'variation' => [
                'income'  => $this->variation($income, $prevIncome),
                'expense' => $this->variation($expense, $prevExpense),
                'balance' => $this->variation($balance, $prevBalance),
            ],
        ];
    }

    public function incomeVsExpense(int $clinicId, array $filters = []): array
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        $rows = FinancialTransaction::query()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->selectRaw('date, type, SUM(gross_amount) as total')
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get();

        $series = [];
        foreach ($rows as $row) {
            $key = $row->date->format('Y-m-d');
            if (!isset($series[$key])) {
                $series[$key] = ['date' => $key, 'income' => 0.0, 'expense' => 0.0];
            }
            if ($row->type === FinancialTransactionType::Entrada) {
                $series[$key]['income'] += (float) $row->total;
            } else {
                $series[$key]['expense'] += (float) $row->total;
            }
        }

        return array_values($series);
    }

    public function categoryDistribution(int $clinicId, array $filters = [], int $limit = 5): array
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        $query = FinancialTransaction::query()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->join('clinic_financial_categories as c', 'c.id', '=', 'clinic_financial_transactions.financial_category_id')
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, SUM(gross_amount) as total')
            ->groupBy('c.id', 'c.name', 'clinic_financial_transactions.type');

        if (!empty($filters['type'])) {
            $query->where('clinic_financial_transactions.type', $filters['type']);
        }

        $rows  = $query->orderByDesc('total')->limit($limit)->get();
        $grand = max(0.01, (float) $rows->sum('total'));

        return $rows->map(fn ($row) => [
            'category_id'   => (int) $row->category_id,
            'name'          => $row->name,
            'type'          => $row->type,
            'total'         => round((float) $row->total, 2),
            'percentage'    => round(((float) $row->total / $grand) * 100, 1),
        ])->all();
    }

    public function monthlyComparison(int $clinicId, int $months = 12): array
    {
        $clinic   = Clinic::findOrFail($clinicId);
        $timezone = $clinic->timezone ?? config('app.timezone');
        $end      = Carbon::now($timezone)->startOfMonth();
        $start    = $end->copy()->subMonths($months - 1);

        [$yearExpr, $monthExpr] = $this->monthPartsSql();

        $rows = FinancialTransaction::query()
            ->forClinic($clinicId)
            ->whereBetween('date', [$start->toDateString(), $end->copy()->endOfMonth()->toDateString()])
            ->selectRaw("{$yearExpr} as year, {$monthExpr} as month, type, SUM(gross_amount) as total")
            ->groupBy(DB::raw($yearExpr), DB::raw($monthExpr), 'type')
            ->get();

        $indexed = [];
        foreach ($rows as $row) {
            $key = sprintf('%04d-%02d', $row->year, $row->month);
            if (!isset($indexed[$key])) {
                $indexed[$key] = ['year' => (int) $row->year, 'month' => (int) $row->month, 'income' => 0.0, 'expense' => 0.0];
            }
            if ($row->type === FinancialTransactionType::Entrada) {
                $indexed[$key]['income'] += (float) $row->total;
            } else {
                $indexed[$key]['expense'] += (float) $row->total;
            }
        }

        $result = [];
        $cursor = $start->copy();
        while ($cursor <= $end) {
            $key      = $cursor->format('Y-m');
            $result[] = $indexed[$key] ?? [
                'year'    => (int) $cursor->format('Y'),
                'month'   => (int) $cursor->format('n'),
                'income'  => 0.0,
                'expense' => 0.0,
            ];
            $cursor->addMonth();
        }

        return $result;
    }

    public function categoryBreakdown(int $clinicId, array $filters = []): array
    {
        $range = $this->resolveDateRange($clinicId, $filters);

        $query = FinancialTransaction::query()
            ->forClinic($clinicId)
            ->whereBetween('date', [$range['from'], $range['to']])
            ->join('clinic_financial_categories as c', 'c.id', '=', 'clinic_financial_transactions.financial_category_id')
            ->selectRaw('c.id as category_id, c.name, clinic_financial_transactions.type, COUNT(*) as count, SUM(gross_amount) as total')
            ->groupBy('c.id', 'c.name', 'clinic_financial_transactions.type');

        if (!empty($filters['type'])) {
            $query->where('clinic_financial_transactions.type', $filters['type']);
        }

        $rows  = $query->orderByDesc('total')->get();
        $grand = max(0.01, (float) $rows->sum('total'));

        return $rows->map(fn ($row) => [
            'category_id' => (int) $row->category_id,
            'name'        => $row->name,
            'type'        => $row->type,
            'count'       => (int) $row->count,
            'total'       => round((float) $row->total, 2),
            'percentage'  => round(((float) $row->total / $grand) * 100, 1),
        ])->all();
    }

    private function variation(float $current, float $previous): ?float
    {
        if ($previous == 0.0) {
            return null;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function monthPartsSql(): array
    {
        return match (DB::connection()->getDriverName()) {
            'pgsql'  => ['EXTRACT(YEAR FROM date)::int', 'EXTRACT(MONTH FROM date)::int'],
            'sqlite' => ["CAST(strftime('%Y', date) AS INTEGER)", "CAST(strftime('%m', date) AS INTEGER)"],
            default  => ['YEAR(date)', 'MONTH(date)'],
        };
    }

    /**
     * @return array{from: string, to: string}
     */
    private function resolveDateRange(int $clinicId, array $filters): array
    {
        if (!empty($filters['from']) && !empty($filters['to'])
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $filters['from'])
            && preg_match('/^\d{4}-\d{2}-\d{2}$/', $filters['to'])) {
            return ['from' => $filters['from'], 'to' => $filters['to']];
        }

        $period = $filters['period'] ?? now()->format('Y-m');
        $clinic = Clinic::find($clinicId);
        $tz     = $clinic?->timezone ?? config('app.timezone');
        $start  = Carbon::createFromFormat('Y-m', $period, $tz)->startOfMonth();

        return [
            'from' => $start->toDateString(),
            'to'   => $start->copy()->endOfMonth()->toDateString(),
        ];
    }
}
