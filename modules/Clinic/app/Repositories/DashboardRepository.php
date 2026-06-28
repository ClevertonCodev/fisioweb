<?php

namespace Modules\Clinic\Repositories;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Modules\Admin\Models\Exercise;
use Modules\Clinic\Contracts\DashboardRepositoryInterface;
use Modules\Clinic\Models\ClinicActivity;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Services\DashboardScope;
use Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface;
use Modules\Patient\Models\Patient;

class DashboardRepository implements DashboardRepositoryInterface
{
    public function __construct(
        protected SchedulingReadServiceInterface $scheduling,
    ) {}

    public function activePatientsCount(DashboardScope $scope): int
    {
        return $this->scopedPatients($scope)->activeStatus()->count();
    }

    public function appointmentsTodayCount(DashboardScope $scope): int
    {
        return $this->scheduling->appointmentsTodayCount($scope->clinicId, $scope->clinicUserId, $scope->timezone);
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
        return collect($this->scheduling->upcomingAppointmentsToday(
            $scope->clinicId,
            $scope->clinicUserId,
            $scope->timezone,
            $limit,
        ));
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
                'can_message' => !empty($p->phone),
            ])
            ->sortBy('day')
            ->values();

        return ['total' => $items->count(), 'items' => $items->all()];
    }

    public function recentActivities(int $clinicId, string $timezone): array
    {
        $appTz = config('app.timezone');
        $start = Carbon::now($timezone)->startOfDay()->setTimezone($appTz);
        $end   = Carbon::now($timezone)->endOfDay()->setTimezone($appTz);

        return ClinicActivity::query()
            ->forClinic($clinicId)
            ->whereBetween('created_at', [$start, $end])
            ->with('actor:id,name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ClinicActivity $a) => [
                'id'          => $a->id,
                'type'        => $a->type->value,
                'description' => $a->description,
                'actor_name'  => $a->actor?->name,
                'created_at'  => $a->created_at?->toIso8601String(),
            ])
            ->all();
    }

    public function patientAcquisition(DashboardScope $scope): array
    {
        $currentYear = Carbon::now($scope->timezone)->year;
        $years       = [$currentYear, $currentYear - 1, $currentYear - 2];
        $minYear     = $currentYear - 2;

        $rows = $this->scopedPatients($scope)
            ->whereYear('created_at', '>=', $minYear)
            ->get(['referral_source', 'created_at']);

        $totalsPerYear = array_fill_keys($years, 0);
        $bySource      = [];

        foreach ($rows as $row) {
            $year = $row->created_at?->year;
            if (!in_array($year, $years, true)) {
                continue;
            }

            $source                      = $row->referral_source ?: 'Não informado';
            $bySource[$source][$year]    = ($bySource[$source][$year] ?? 0) + 1;
            $totalsPerYear[$year]++;
        }

        $grandTotal = array_sum($totalsPerYear);
        $sources    = [];

        foreach ($bySource as $source => $perYear) {
            $full  = array_fill_keys($years, 0);
            foreach ($perYear as $year => $count) {
                $full[$year] = $count;
            }
            $total     = array_sum($full);
            $sources[] = [
                'source'        => $source,
                'per_year'      => $full,
                'total'         => $total,
                'percent_total' => $grandTotal > 0 ? round($total / $grandTotal * 100, 1) : 0.0,
            ];
        }

        usort($sources, fn ($a, $b) => $b['total'] <=> $a['total']);

        return ['years' => $years, 'sources' => $sources, 'totals_per_year' => $totalsPerYear];
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

    /** @return array{0:string,1:string} datas (Y-m-d) de início/fim do mês corrente. */
    private function currentMonthDates(DashboardScope $scope): array
    {
        $now = Carbon::now($scope->timezone);

        return [$now->copy()->startOfMonth()->toDateString(), $now->copy()->endOfMonth()->toDateString()];
    }
}
