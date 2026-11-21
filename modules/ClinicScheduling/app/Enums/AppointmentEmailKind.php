<?php

namespace Modules\ClinicScheduling\Enums;

enum AppointmentEmailKind: string
{
    case Scheduled   = 'scheduled';
    case Rescheduled = 'rescheduled';
    case Cancelled   = 'cancelled';

    public function matchesStatus(AppointmentStatus $status): bool
    {
        return match ($this) {
            self::Cancelled => $status === AppointmentStatus::Cancelled,
            self::Scheduled, self::Rescheduled => $status !== AppointmentStatus::Cancelled,
        };
    }
}
