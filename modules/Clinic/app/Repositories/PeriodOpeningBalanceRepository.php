<?php

namespace Modules\Clinic\Repositories;

use Modules\Clinic\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\Clinic\Models\PeriodOpeningBalance;

class PeriodOpeningBalanceRepository implements PeriodOpeningBalanceRepositoryInterface
{
    public function __construct(
        protected PeriodOpeningBalance $model,
    ) {}

    public function findForPeriod(int $clinicId, int $year, int $month): ?PeriodOpeningBalance
    {
        return $this->model
            ->where('clinic_id', $clinicId)
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }

    public function upsert(int $clinicId, int $year, int $month, string $amount, int $updatedByUserId): PeriodOpeningBalance
    {
        return $this->model->updateOrCreate(
            [
                'clinic_id' => $clinicId,
                'year'      => $year,
                'month'     => $month,
            ],
            [
                'amount'              => $amount,
                'updated_by_user_id'  => $updatedByUserId,
            ],
        );
    }
}
