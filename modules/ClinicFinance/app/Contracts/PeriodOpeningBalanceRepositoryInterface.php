<?php

namespace Modules\ClinicFinance\Contracts;

use Modules\ClinicFinance\Models\PeriodOpeningBalance;

interface PeriodOpeningBalanceRepositoryInterface
{
    public function findForPeriod(int $clinicId, int $year, int $month): ?PeriodOpeningBalance;

    /** O último saldo digitado num mês anterior a $year/$month. */
    public function findLatestBefore(int $clinicId, int $year, int $month): ?PeriodOpeningBalance;

    public function upsert(int $clinicId, int $year, int $month, string $amount, int $updatedByUserId): PeriodOpeningBalance;

    public function deleteForPeriod(int $clinicId, int $year, int $month): void;
}
