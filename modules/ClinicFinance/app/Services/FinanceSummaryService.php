<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Events\OpeningBalanceUpdated;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;

class FinanceSummaryService implements FinanceSummaryServiceInterface
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $transactionRepository,
        protected PeriodOpeningBalanceRepositoryInterface $openingBalanceRepository,
        protected TransactionPeopleServiceInterface $people,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function summary(int $clinicId, array $filters = []): array
    {
        $period         = $filters['period'] ?? now()->format('Y-m');
        [$year, $month] = array_map('intval', explode('-', $period));

        $aggregates                = $this->transactionRepository->aggregateSummary($clinicId, $this->withPatientSearch($clinicId, $filters));
        [$opening, $openingSource] = $this->openingBalance($clinicId, $year, $month);

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
            'opening_balance'        => round($opening, 2),
            'opening_balance_source' => $openingSource,
            'available'              => round($available, 2),
            'forecast'               => round($forecast, 2),
        ];
    }

    /**
     * Como na listagem: a busca (`q`) também acha pelo nome do paciente, com os ids vindos do
     * contrato de Patient. Sempre sobrescreve `q_patient_ids` (o cliente não manda ids).
     */
    private function withPatientSearch(int $clinicId, array $filters): array
    {
        $term = is_string($filters['q'] ?? null) ? trim($filters['q']) : '';

        return [
            ...$filters,
            // `empty` como o repositório: lá um `q` vazio (ou "0") não filtra nada.
            'q_patient_ids' => empty($term) ? [] : $this->people->patientIdsMatching($clinicId, $term),
        ];
    }

    /**
     * O digitado no mês, quando há. Senão, o último digitado antes dele mais o líquido
     * realizado do início daquele mês até o fim do mês anterior; sem nenhum digitado,
     * todo o realizado antes do mês. Duas consultas, sem laço de meses.
     *
     * @return array{0: float, 1: string}
     */
    private function openingBalance(int $clinicId, int $year, int $month): array
    {
        $typed = $this->openingBalanceRepository->findForPeriod($clinicId, $year, $month);
        if (!is_null($typed)) {
            return [(float) $typed->amount, 'typed'];
        }

        $base     = $this->openingBalanceRepository->findLatestBefore($clinicId, $year, $month);
        $from     = is_null($base) ? null : $this->monthStart($base->year, $base->month);
        $realized = $this->transactionRepository->realizedNetBetween($clinicId, $from, $this->monthStart($year, $month));

        return [(float) ($base?->amount ?? 0) + $realized, 'computed'];
    }

    private function monthStart(int $year, int $month): string
    {
        return sprintf('%04d-%02d-01', $year, $month);
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

    public function clearOpeningBalance(int $clinicId, int $year, int $month): void
    {
        $this->openingBalanceRepository->deleteForPeriod($clinicId, $year, $month);
    }
}
