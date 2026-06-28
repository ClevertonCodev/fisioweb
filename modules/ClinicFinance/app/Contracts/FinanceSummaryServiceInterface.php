<?php

namespace Modules\ClinicFinance\Contracts;

use Modules\ClinicFinance\Models\PeriodOpeningBalance;

interface FinanceSummaryServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function summary(int $clinicId, array $filters = []): array;

    public function updateOpeningBalance(int $clinicId, int $year, int $month, string $amount, int $updatedByUserId): PeriodOpeningBalance;
}
