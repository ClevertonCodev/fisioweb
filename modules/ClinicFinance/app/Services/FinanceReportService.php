<?php

namespace Modules\ClinicFinance\Services;

use Carbon\Carbon;
use Modules\ClinicFinance\Contracts\FinanceReportServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionType;

class FinanceReportService implements FinanceReportServiceInterface
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
        $rows = $this->transactionRepository->incomeVsExpenseRows($clinicId, $filters);

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
        $rows  = $this->transactionRepository->categoryDistributionRows($clinicId, $filters, $limit);
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
        $comparison = $this->transactionRepository->monthlyComparisonRows($clinicId, $months);
        $start      = $comparison['start'];
        $end        = $comparison['end'];
        $rows       = $comparison['rows'];

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
        $rows  = $this->transactionRepository->categoryBreakdownRows($clinicId, $filters);
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
}
