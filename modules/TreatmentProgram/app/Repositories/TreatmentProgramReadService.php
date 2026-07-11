<?php

namespace Modules\TreatmentProgram\Repositories;

use Modules\TreatmentProgram\Contracts\Public\TreatmentProgramReadServiceInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class TreatmentProgramReadService implements TreatmentProgramReadServiceInterface
{
    public function activeProgramsCount(
        int $clinicId,
        ?int $clinicUserId,
        string $monthStart,
        string $monthEnd,
    ): int {
        $query = TreatmentPlan::query()
            ->where('clinic_id', $clinicId)
            ->where('status', TreatmentPlan::STATUS_ACTIVE)
            ->whereHas('patient', fn ($q) => $q->activeStatus())
            ->whereDate('start_date', '<=', $monthEnd)
            ->where(function ($q) use ($monthStart) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $monthStart);
            });

        if (!is_null($clinicUserId)) {
            $query->where('clinic_user_id', $clinicUserId);
        }

        return $query->count();
    }
}
