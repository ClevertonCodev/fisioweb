<?php

namespace Modules\ClinicFinance\Services;

use Carbon\Carbon;
use Modules\ClinicFinance\Contracts\FinanceCalendarServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Enums\FinancialTransactionType;

class FinanceCalendarService implements FinanceCalendarServiceInterface
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $transactionRepository,
    ) {}

    public function month(int $clinicId, string $period): array
    {
        $start = Carbon::createFromFormat('Y-m-d', "{$period}-01")->startOfDay();
        $rows  = $this->transactionRepository->dailyNetTotalsRows(
            $clinicId,
            $start->toDateString(),
            $start->copy()->endOfMonth()->toDateString(),
        );

        $days = [];
        foreach ($rows as $row) {
            $date          = Carbon::parse($row->date)->toDateString();
            $days[$date] ??= ['date' => $date, 'income' => 0.0, 'expense' => 0.0];
            $key           = $row->type === FinancialTransactionType::Entrada ? 'income' : 'expense';
            $days[$date][$key] += (float) $row->total;
        }

        return [
            'period' => $period,
            'days'   => array_values(array_map(fn (array $day) => [
                'date'    => $day['date'],
                'income'  => round($day['income'], 2),
                'expense' => round($day['expense'], 2),
            ], $days)),
        ];
    }
}
