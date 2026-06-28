<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\ClinicFinance\Events\OpeningBalanceUpdated;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;

class FinanceSummaryService implements FinanceSummaryServiceInterface
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

    public function updateOpeningBalance(int $clinicId, int $year, int $month, string $amount, int $updatedByUserId): PeriodOpeningBalance
    {
        $balance = $this->openingBalanceRepository->upsert($clinicId, $year, $month, $amount, $updatedByUserId);

        $event = new OpeningBalanceUpdated(
            version: 1,
            openingBalanceId: (int) $balance->id,
            clinicId: (int) $balance->clinic_id,
            actorId: Auth::guard('clinic')->id(),
            year: (int) $balance->year,
            month: (int) $balance->month,
            amount: (string) $balance->amount,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $balance;
    }
}
