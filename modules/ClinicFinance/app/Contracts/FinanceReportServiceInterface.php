<?php

namespace Modules\ClinicFinance\Contracts;

interface FinanceReportServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function reportSummary(int $clinicId, array $filters = []): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function incomeVsExpense(int $clinicId, array $filters = []): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function categoryDistribution(int $clinicId, array $filters = [], int $limit = 5): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function monthlyComparison(int $clinicId, int $months = 12): array;

    /**
     * @return array<int, array<string, mixed>>
     */
    public function categoryBreakdown(int $clinicId, array $filters = []): array;
}
