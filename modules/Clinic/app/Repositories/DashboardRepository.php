<?php

namespace Modules\Clinic\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Contracts\DashboardRepositoryInterface;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Services\DashboardScope;
use Modules\Patient\Models\Patient;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function activePatientsCount(DashboardScope $scope): int
    {
        return $this->scopedPatients($scope)->activeStatus()->count();
    }

    public function appointmentsTodayCount(DashboardScope $scope): int
    {
        return $this->todaysAppointments($scope)->count();
    }

    public function activeProgramsCount(DashboardScope $scope): int
    {
        [$monthStart, $monthEnd] = $this->currentMonthDates($scope);

        $query = TreatmentPlan::query()
            ->where('clinic_id', $scope->clinicId)
            ->where('status', TreatmentPlan::STATUS_ACTIVE)
            ->whereHas('patient', fn ($q) => $q->activeStatus())
            ->whereDate('start_date', '<=', $monthEnd)
            ->where(function ($q) use ($monthStart) {
                $q->whereNull('end_date')->orWhereDate('end_date', '>=', $monthStart);
            });

        if ($scope->clinicUserId !== null) {
            $query->where('clinic_user_id', $scope->clinicUserId);
        }

        return $query->count();
    }

    public function availableExercises(): array
    {
        $base = Exercise::query()->where('is_active', true)->whereHas('videos');

        return [
            'count'            => (clone $base)->count(),
            'categories_count' => (clone $base)->whereNotNull('body_region_id')->distinct()->count('body_region_id'),
        ];
    }

    public function upcomingAppointmentsToday(DashboardScope $scope, int $limit = 5): Collection
    {
        return $this->todaysAppointments($scope)
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
            ]);
    }

    public function monthBirthdays(DashboardScope $scope): array
    {
        $month = Carbon::now($scope->timezone)->month;

        $items = $this->scopedPatients($scope)
            ->whereNotNull('birth_date')
            ->whereMonth('birth_date', $month)
            ->get(['id', 'name', 'photo_url', 'phone', 'birth_date'])
            ->map(fn (Patient $p) => [
                'patient_id'  => $p->id,
                'name'        => $p->name,
                'photo_url'   => $p->photo_url,
                'day'         => $p->birth_date?->day,
                'phone'       => $p->phone,
                'can_message' => ! empty($p->phone),
            ])
            ->sortBy('day')
            ->values();

        return ['total' => $items->count(), 'items' => $items->all()];
    }

    /** Query base de pacientes do escopo (clínica + profissional opcional). */
    private function scopedPatients(DashboardScope $scope)
    {
        $query = Patient::query()->where('clinic_id', $scope->clinicId);

        if ($scope->clinicUserId !== null) {
            $query->where('clinic_user_id', $scope->clinicUserId);
        }

        return $query;
    }

    /** Query base de consultas de hoje (não canceladas) no timezone da clínica. */
    private function todaysAppointments(DashboardScope $scope)
    {
        $appTz = config('app.timezone');
        $start = Carbon::now($scope->timezone)->startOfDay()->setTimezone($appTz);
        $end   = Carbon::now($scope->timezone)->endOfDay()->setTimezone($appTz);

        $query = Appointment::query()
            ->where('clinic_id', $scope->clinicId)
            ->where('status', '!=', AppointmentStatus::Cancelled)
            ->whereBetween('starts_at', [$start, $end]);

        if ($scope->clinicUserId !== null) {
            $query->where('clinic_user_id', $scope->clinicUserId);
        }

        return $query;
    }

    /** @return array{0:string,1:string} datas (Y-m-d) de início/fim do mês corrente. */
    private function currentMonthDates(DashboardScope $scope): array
    {
        $now = Carbon::now($scope->timezone);

        return [$now->copy()->startOfMonth()->toDateString(), $now->copy()->endOfMonth()->toDateString()];
    }
}
