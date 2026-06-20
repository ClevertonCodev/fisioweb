<?php

namespace Modules\Clinic\Services;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Enums\ActivityType;
use Modules\Clinic\Models\ClinicActivity;

class ActivityLogger implements ActivityLoggerInterface
{
    public function log(int $clinicId, ActivityType $type, string $description, ?Model $subject = null): void
    {
        ClinicActivity::create([
            'clinic_id'      => $clinicId,
            'clinic_user_id' => Auth::guard('clinic')->id(),
            'type'           => $type,
            'description'    => $description,
            'subject_type'   => $subject ? $subject::class : null,
            'subject_id'     => $subject?->getKey(),
        ]);
    }
}
