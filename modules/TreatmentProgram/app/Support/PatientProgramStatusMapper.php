<?php

namespace Modules\TreatmentProgram\Support;

use Carbon\Carbon;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class PatientProgramStatusMapper
{
    public const STATUS_AVAILABLE = 'available';

    public const STATUS_SCHEDULED = 'scheduled';

    public const STATUS_UNAVAILABLE = 'unavailable';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_INACTIVE = 'inactive';

    public function map(TreatmentPlan $plan, ?Carbon $today = null): string
    {
        if ($plan->status === TreatmentPlan::STATUS_CANCELLED) {
            return self::STATUS_INACTIVE;
        }

        if ($plan->patient_completed_count > 0 || $plan->status === TreatmentPlan::STATUS_COMPLETED) {
            return self::STATUS_COMPLETED;
        }

        if ($plan->status !== TreatmentPlan::STATUS_ACTIVE) {
            return self::STATUS_UNAVAILABLE;
        }

        $today = $today ?? Carbon::today();

        if (!is_null($plan->start_date) && $plan->start_date->gt($today)) {
            return self::STATUS_SCHEDULED;
        }

        if (!is_null($plan->end_date) && $plan->end_date->lt($today)) {
            return self::STATUS_UNAVAILABLE;
        }

        return self::STATUS_AVAILABLE;
    }

    public function allowsStart(TreatmentPlan $plan, ?Carbon $today = null): bool
    {
        return $this->map($plan, $today) === self::STATUS_AVAILABLE;
    }
}
