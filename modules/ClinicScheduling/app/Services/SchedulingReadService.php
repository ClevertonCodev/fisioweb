<?php

namespace Modules\ClinicScheduling\Services;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;

class SchedulingReadService implements SchedulingReadServiceInterface
{
    public function appointmentsTodayCount(int $clinicId, ?int $clinicUserId, string $timezone): int
    {
        return $this->todaysAppointments($clinicId, $clinicUserId, $timezone)->count();
    }

    public function upcomingAppointmentsToday(int $clinicId, ?int $clinicUserId, string $timezone, int $limit = 5): array
    {
        return $this->todaysAppointments($clinicId, $clinicUserId, $timezone)
            ->with('patient:id,name,photo_url')
            ->orderBy('starts_at')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $a) => [
                'id'                => $a->id,
                'patient_name'      => $a->patient?->name ?? '',
                'patient_photo_url' => $a->patient?->photo_url,
                'title'             => $a->title,
                'starts_at'         => $a->starts_at?->toIso8601String(),
                'status'            => $a->status?->value,
            ])
            ->all();
    }

    public function occupancyIntervals(int $clinicId, int $clinicUserId, CarbonInterface $rangeStart, CarbonInterface $rangeEnd): array
    {
        return Appointment::query()
            ->where('clinic_id', $clinicId)
            ->where('clinic_user_id', $clinicUserId)
            ->where('status', '!=', AppointmentStatus::Cancelled)
            ->whereBetween('starts_at', [$rangeStart, $rangeEnd])
            ->get(['starts_at', 'ends_at'])
            ->map(fn (Appointment $a) => [
                'starts_at' => $a->starts_at,
                'ends_at'   => $a->ends_at,
            ])
            ->all();
    }

    /** Query base de consultas de hoje (não canceladas) no timezone da clínica. */
    private function todaysAppointments(int $clinicId, ?int $clinicUserId, string $timezone)
    {
        $appTz = config('app.timezone');
        $start = Carbon::now($timezone)->startOfDay()->setTimezone($appTz);
        $end   = Carbon::now($timezone)->endOfDay()->setTimezone($appTz);

        $query = Appointment::query()
            ->where('clinic_id', $clinicId)
            ->where('status', '!=', AppointmentStatus::Cancelled)
            ->whereBetween('starts_at', [$start, $end]);

        if (!is_null($clinicUserId)) {
            $query->where('clinic_user_id', $clinicUserId);
        }

        return $query;
    }
}
