<?php

namespace Modules\TreatmentProgram\Services;

use Carbon\Carbon;
use Illuminate\Support\Str;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class ProgramPdfViewModelBuilder
{
    public const MAX_ANNOTATION_MONTHS = 3;

    public const EMPTY_GROUP_LABEL = 'Novo Grupo';

    /**
     * @return array{
     *     responsibleName: string,
     *     responsiblePhotoUrl: string|null,
     *     responsibleInitials: string,
     *     responsibleCredential: string|null,
     *     responsibleEmail: string|null,
     *     responsiblePhone: string|null,
     *     qrUrl: string|null,
     *     patientLabel: string,
     *     observations: string,
     *     annotationMonths: list<array{title: string, monthKey: string, days: list<array{dayOfMonth: int, weekdayShort: string}>}>
     * }
     */
    public function build(TreatmentPlan $plan): array
    {
        $responsible = $plan->clinicUser;
        $clinic      = $plan->clinic;
        $name        = $responsible?->name ?? $clinic?->name ?? config('app.name');

        return [
            'responsibleName'       => $name,
            'responsiblePhotoUrl'   => $responsible?->photo_url,
            'responsibleInitials'   => $this->initials($name),
            'responsibleCredential' => !empty($responsible?->document) ? $responsible->document : null,
            'responsibleEmail'      => !empty($responsible?->email) ? $responsible->email : (!empty($clinic?->email) ? $clinic->email : null),
            'responsiblePhone'      => !empty($clinic?->phone) ? $clinic->phone : null,
            'qrUrl'                 => $this->deepLinkUrl($plan),
            'patientLabel'          => $plan->patient?->name ?? '—',
            'observations'          => $plan->notes ?? $plan->message ?? '',
            'annotationMonths'      => $this->annotationMonths($plan->start_date, $plan->end_date),
        ];
    }

    public function groupDisplayName(?string $name): string
    {
        if (is_null($name) || empty(trim($name))) {
            return self::EMPTY_GROUP_LABEL;
        }

        return $name;
    }

    public function deepLinkUrl(TreatmentPlan $plan): ?string
    {
        if (is_null($plan->patient_id)) {
            return null;
        }

        $slug = $plan->clinic?->slug;
        if (empty($slug)) {
            return null;
        }

        if (empty($plan->public_token)) {
            $plan->public_token = (string) Str::uuid();
            $plan->saveQuietly();
        }

        return rtrim((string) config('app.url'), '/')
            . '/' . $slug
            . '/paciente/programas/'
            . $plan->public_token;
    }

    /**
     * @return list<array{title: string, monthKey: string, days: list<array{dayOfMonth: int, weekdayShort: string}>}>
     */
    public function annotationMonths(mixed $startDate, mixed $endDate): array
    {
        if (is_null($startDate) || is_null($endDate)) {
            return [];
        }

        $start = Carbon::parse($startDate)->startOfDay();
        $end   = Carbon::parse($endDate)->startOfDay();
        if ($end->lt($start)) {
            return [];
        }

        $weekdays = [
            0 => 'DOM',
            1 => 'SEG',
            2 => 'TER',
            3 => 'QUA',
            4 => 'QUI',
            5 => 'SEX',
            6 => 'SÁB',
        ];

        $monthNames = [
            1  => 'Janeiro',
            2  => 'Fevereiro',
            3  => 'Março',
            4  => 'Abril',
            5  => 'Maio',
            6  => 'Junho',
            7  => 'Julho',
            8  => 'Agosto',
            9  => 'Setembro',
            10 => 'Outubro',
            11 => 'Novembro',
            12 => 'Dezembro',
        ];

        $cursor = $start->copy()->startOfMonth();
        $months = [];

        while ($cursor->lte($end) && count($months) < self::MAX_ANNOTATION_MONTHS) {
            $monthStart = $cursor->copy()->startOfMonth();
            $monthEnd   = $cursor->copy()->endOfMonth();
            $rangeStart = $start->gt($monthStart) ? $start->copy() : $monthStart;
            $rangeEnd   = $end->lt($monthEnd) ? $end->copy() : $monthEnd;

            $days = [];
            $day  = $rangeStart->copy();
            while ($day->lte($rangeEnd)) {
                $days[] = [
                    'dayOfMonth'   => (int) $day->day,
                    'weekdayShort' => $weekdays[(int) $day->dayOfWeek] ?? '',
                ];
                $day->addDay();
            }

            if (!empty($days)) {
                $months[] = [
                    'title'    => 'Anotações de ' . ($monthNames[(int) $cursor->month] ?? $cursor->format('F')),
                    'monthKey' => $cursor->format('Y-m'),
                    'days'     => $days,
                ];
            }

            $cursor->addMonth()->startOfMonth();
        }

        return $months;
    }

    private function initials(string $name): string
    {
        return collect(explode(' ', $name))
            ->filter()
            ->take(2)
            ->map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)))
            ->implode('');
    }
}
