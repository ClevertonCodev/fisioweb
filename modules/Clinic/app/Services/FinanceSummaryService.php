<?php

namespace Modules\Clinic\Services;

use Modules\Clinic\Contracts\FinancialTransactionRepositoryInterface;
use Modules\Clinic\Contracts\PeriodOpeningBalanceRepositoryInterface;

class FinanceSummaryService
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $transactionRepository,
        protected PeriodOpeningBalanceRepositoryInterface $openingBalanceRepository,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(int $clinicId, array $filters = []): array
    {
        $period         = $filters['period'] ?? now()->format('Y-m');
        [$year, $month] = array_map('intval', explode('-', $period));

        $aggregates     = $this->transactionRepository->aggregateSummary($clinicId, $filters);
        $openingBalance = $this->openingBalanceRepository->findForPeriod($clinicId, $year, $month);
        $opening        = (float) ($openingBalance?->amount ?? 0);

        $available = $opening + $aggregates['received'] - $aggregates['paid'];
        $forecast  = $available + $aggregates['pending_income'] - $aggregates['pending_expense'];

        return [
            'period' => [
                'year'  => $year,
                'month' => $month,
            ],
            'income' => [
                'received' => round($aggregates['received'], 2),
                'pending'  => round($aggregates['pending_income'], 2),
            ],
            'expense' => [
                'paid'    => round($aggregates['paid'], 2),
                'pending' => round($aggregates['pending_expense'], 2),
            ],
            'opening_balance' => round($opening, 2),
            'available'       => round($available, 2),
            'forecast'        => round($forecast, 2),
        ];
    }
}
