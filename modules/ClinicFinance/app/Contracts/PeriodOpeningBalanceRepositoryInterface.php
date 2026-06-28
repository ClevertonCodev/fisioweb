<?php

namespace Modules\ClinicFinance\Contracts;

use Modules\ClinicFinance\Models\PeriodOpeningBalance;

interface PeriodOpeningBalanceRepositoryInterface
{
    public function findForPeriod(int $clinicId, int $year, int $month): ?PeriodOpeningBalance;

    public function upsert(int $clinicId, int $year, int $month, string $amount, int $updatedByUserId): PeriodOpeningBalance;
}
