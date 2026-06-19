<?php

namespace Modules\Clinic\Services;

use Carbon\Carbon;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\Clinic;

/**
 * Calcula a Taxa de ocupação de um fisioterapeuta (FR-019a/b):
 * ocupação = soma das durações das consultas (não canceladas) ÷ tempo disponível
 * (janela de atendimento da clínica) no período do bucket.
 *
 * Granularidades (FR-019b):
 * - daily   → dias do mês corrente
 * - weekly  → últimas 12 semanas
 * - monthly → meses do ano corrente
 */
class OccupancyRateService
{
    public const GRANULARITIES = ['daily', 'weekly', 'monthly'];

    private const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    /**
     * @return array{occupied_rate:float,buckets:array<int,array{label:string,rate:float}>}
     */
    public function compute(Clinic $clinic, int $clinicUserId, string $granularity): array
    {
        $tz      = $clinic->timezone ?: config('app.timezone');
        $window  = $clinic->workingWindow();
        $buckets = $this->buildBuckets($granularity, $tz);

        $appTz        = config('app.timezone');
        $rangeStart   = $buckets[0]['start']->copy()->setTimezone($appTz);
        $rangeEnd     = end($buckets)['end']->copy()->setTimezone($appTz);
        $appointments = Appointment::query()
            ->where('clinic_id', $clinic->id)
            ->where('clinic_user_id', $clinicUserId)
            ->where('status', '!=', AppointmentStatus::Cancelled)
            ->whereBetween('starts_at', [$rangeStart, $rangeEnd])
            ->get(['starts_at', 'ends_at']);

        $result         = [];
        $totalOccupied  = 0;
        $totalAvailable = 0;

        foreach ($buckets as $bucket) {
            $occupied  = 0;
            foreach ($appointments as $apt) {
                $startsLocal = $apt->starts_at->copy()->setTimezone($tz);
                if ($startsLocal->gte($bucket['start']) && $startsLocal->lt($bucket['end'])) {
                    $occupied += $apt->starts_at->diffInMinutes($apt->ends_at);
                }
            }

            $available = $this->availableMinutes($bucket['start'], $bucket['end'], $window);
            $result[]  = [
                'label' => $bucket['label'],
                'rate'  => $available > 0 ? round($occupied / $available, 3) : 0.0,
            ];

            $totalOccupied += $occupied;
            $totalAvailable += $available;
        }

        return [
            'occupied_rate' => $totalAvailable > 0 ? round($totalOccupied / $totalAvailable, 3) : 0.0,
            'buckets'       => $result,
        ];
    }

    /**
     * @return array<int,array{label:string,start:Carbon,end:Carbon}>
     */
    private function buildBuckets(string $granularity, string $tz): array
    {
        $now     = Carbon::now($tz);
        $buckets = [];

        if ($granularity === 'monthly') {
            $yearStart = $now->copy()->startOfYear();
            for ($m = 0; $m < 12; $m++) {
                $start     = $yearStart->copy()->addMonths($m);
                $buckets[] = ['label' => self::MONTH_LABELS[$m], 'start' => $start, 'end' => $start->copy()->addMonth()];
            }

            return $buckets;
        }

        if ($granularity === 'weekly') {
            $weekStart = $now->copy()->startOfWeek(Carbon::MONDAY);
            for ($w = 11; $w >= 0; $w--) {
                $start     = $weekStart->copy()->subWeeks($w);
                $buckets[] = ['label' => $start->format('d/m'), 'start' => $start, 'end' => $start->copy()->addWeek()];
            }

            return $buckets;
        }

        // daily — dias do mês corrente
        $monthStart = $now->copy()->startOfMonth();
        $days       = $monthStart->daysInMonth;
        for ($d = 0; $d < $days; $d++) {
            $start     = $monthStart->copy()->addDays($d);
            $buckets[] = ['label' => (string) ($d + 1), 'start' => $start, 'end' => $start->copy()->addDay()];
        }

        return $buckets;
    }

    /** Minutos disponíveis = (fim − início da janela) × dias atendidos no intervalo. */
    private function availableMinutes(Carbon $start, Carbon $end, array $window): int
    {
        $perDay   = $this->minutesBetween($window['start'], $window['end']);
        $minutes  = 0;
        $cursor   = $start->copy();

        while ($cursor->lt($end)) {
            if (in_array($cursor->isoWeekday(), $window['days'], true)) {
                $minutes += $perDay;
            }
            $cursor->addDay();
        }

        return $minutes;
    }

    private function minutesBetween(string $from, string $to): int
    {
        [$fh, $fm] = array_map('intval', explode(':', $from));
        [$th, $tm] = array_map('intval', explode(':', $to));

        return max(0, ($th * 60 + $tm) - ($fh * 60 + $fm));
    }
}
