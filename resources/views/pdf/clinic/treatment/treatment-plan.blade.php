<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $plan->title }}</title>
    <style>
        /* Vedius reference margins */
        @page { margin: 18mm 16mm 22mm 16mm; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 14px;
            color: #192840;
            line-height: 1.4;
        }

        .footer {
            position: fixed;
            left: 0;
            right: 0;
            bottom: -16mm;
            text-align: center;
            font-size: 10px;
            color: #6d7a8e;
        }

        /* —— Capa —— */
        .cover { page-break-after: always; }

        .cover-header {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 50px;
        }

        .cover-header td { vertical-align: top; }

        .avatar {
            width: 100px;
            height: 100px;
            object-fit: cover;
            display: block;
            border-radius: 4px;
        }

        .avatar-fallback {
            width: 100px;
            height: 100px;
            background: #192840;
            color: #fff;
            font-size: 28px;
            font-weight: bold;
            text-align: center;
            line-height: 100px;
            border-radius: 4px;
        }

        .resp-name {
            font-size: 18px;
            font-weight: bold;
            color: #192840;
            margin: 0 0 6px 16px;
        }

        .resp-line {
            font-size: 12px;
            color: #192840;
            margin: 0 0 4px 16px;
        }

        .resp-contact {
            font-size: 12px;
            color: #192840;
            margin: 12px 0 0 16px;
        }

        .resp-contact span { margin-right: 18px; }

        .qr-wrap { text-align: center; width: 140px; }
        .qr-wrap img { width: 120px; height: 120px; display: block; margin: 0 auto 6px; }
        .qr-wrap span { font-size: 10px; color: #6d7a8e; }

        .cover-title {
            font-size: 26px;
            font-weight: bold;
            color: #192840;
            line-height: 1.25;
            margin: 0 0 16px;
        }

        .cover-patient {
            font-size: 14px;
            color: #6d7a8e;
            margin-bottom: 40px;
        }

        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 46px;
        }

        .meta td { vertical-align: top; padding-right: 32px; }

        .meta-label {
            font-size: 11px;
            color: #6d7a8e;
            margin-bottom: 6px;
        }

        .meta-value {
            font-size: 14px;
            font-weight: bold;
            color: #192840;
        }

        .meta-days {
            font-size: 14px;
            color: #96a0b0;
            padding-left: 12px;
        }

        .notes-label {
            font-size: 16px;
            font-weight: bold;
            color: #192840;
            margin-bottom: 10px;
        }

        .notes-text {
            font-size: 14px;
            color: #192840;
            line-height: 1.5;
        }

        /* —— Exercícios (1 por página, como Vedius) —— */
        .ex-page {
            page-break-after: always;
        }

        .ex-page-last {
            page-break-after: auto;
        }

        .ex-section {
            font-size: 16px;
            font-weight: bold;
            color: #192840;
            margin-bottom: 12px;
        }

        .ex-group {
            font-size: 20px;
            font-weight: bold;
            color: #192840;
            margin-bottom: 20px;
        }

        .ex-layout {
            width: 100%;
            border-collapse: collapse;
        }

        .ex-layout td { vertical-align: top; }

        .ex-photos {
            width: 46%;
            padding-right: 24px;
        }

        .ex-photos img {
            width: 100%;
            max-width: 320px;
            height: auto;
            display: block;
            margin: 0 0 16px;
        }

        .ex-photos .ph {
            width: 320px;
            height: 240px;
            background: #e8ecf1;
            color: #96a0b0;
            font-size: 36px;
            text-align: center;
            line-height: 240px;
            margin-bottom: 16px;
        }

        .ex-extra {
            margin-top: 16px;
            font-size: 12px;
            color: #192840;
            line-height: 1.45;
        }

        .ex-extra strong {
            font-weight: bold;
        }

        .ex-body { width: 54%; }

        .ex-name {
            font-size: 20px;
            font-weight: bold;
            color: #192840;
            margin-bottom: 14px;
            line-height: 1.3;
        }

        .ex-desc {
            font-size: 14px;
            color: #000000;
            line-height: 1.45;
            margin-bottom: 24px;
        }

        .stat-line {
            font-size: 14px;
            color: #6d7a8e;
            margin-bottom: 10px;
            line-height: 1.35;
        }

        .stat-line .v {
            color: #192840;
        }

        /* —— Anotações —— */
        .ann-page { page-break-before: always; }

        .ann-title {
            font-size: 24px;
            font-weight: bold;
            color: #192840;
            margin-bottom: 14px;
        }

        .ann-help {
            font-size: 12px;
            color: #6d7a8e;
            margin-bottom: 36px;
            line-height: 1.45;
            max-width: 90%;
        }

        .ann-table {
            width: 100%;
            border-collapse: collapse;
        }

        .ann-table td {
            width: 50%;
            vertical-align: top;
            padding-right: 28px;
        }

        .ann-row {
            margin-bottom: 6px;
            padding-bottom: 18px;
            border-bottom: 1px solid #d5dae3;
        }

        .ann-box {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 1.5px solid #96a0b0;
            margin-right: 10px;
            vertical-align: middle;
        }

        .ann-day {
            font-size: 14px;
            color: #6d7a8e;
            vertical-align: middle;
        }
    </style>
</head>
<body>

@php
    $pdfMeta = $pdfMeta ?? [];
    $qrImageSrc = $qrImageSrc ?? null;
    $groupLabel = $groupLabel ?? fn (?string $name) => (is_null($name) || trim($name) === '') ? 'Novo Grupo' : $name;

    $formatRange = fn (?int $min, ?int $max): ?string => match (true) {
        $min === null && $max === null => null,
        $min === $max || $max === null => (string) $min,
        default => "{$min} - {$max}",
    };

    $formatFreq = function (?array $days): ?string {
        if (empty($days)) {
            return null;
        }

        return count($days) . 'x/semana';
    };

    $formatRest = function ($rest): ?string {
        if ($rest === null || $rest === '') {
            return null;
        }
        if (is_numeric($rest)) {
            $seconds = (int) $rest;
            if ($seconds >= 60 && $seconds % 60 === 0) {
                $min = (int) ($seconds / 60);

                return $min . ' minuto' . ($min !== 1 ? 's' : '');
            }

            return $seconds . ' segundo' . ($seconds !== 1 ? 's' : '');
        }

        return (string) $rest;
    };

    $formatPtDate = function ($date): string {
        if (! $date) {
            return '—';
        }
        $months = [
            1 => 'janeiro', 2 => 'fevereiro', 3 => 'março', 4 => 'abril',
            5 => 'maio', 6 => 'junho', 7 => 'julho', 8 => 'agosto',
            9 => 'setembro', 10 => 'outubro', 11 => 'novembro', 12 => 'dezembro',
        ];
        $c = \Carbon\Carbon::parse($date);

        return $c->day . ' ' . ($months[(int) $c->month] ?? $c->format('F'));
    };

    $daysTotal = ($plan->start_date && $plan->end_date)
        ? (int) \Carbon\Carbon::parse($plan->start_date)->diffInDays($plan->end_date) + 1
        : null;

    $periodLabel = null;
    if ($plan->start_date) {
        $periodLabel = $formatPtDate($plan->start_date);
        if ($plan->end_date) {
            $end = \Carbon\Carbon::parse($plan->end_date);
            $periodLabel .= ' -> ' . $formatPtDate($plan->end_date) . ', ' . $end->year;
        }
    }

    $exercisePages = collect();
    $currentGroup = null;
    foreach ($plan->groups as $group) {
        $gName = $groupLabel($group->name);
        $first = true;
        foreach ($group->exercises as $ex) {
            $exercisePages->push([
                'group' => $first ? $gName : null,
                'item'  => $ex,
            ]);
            $first = false;
            $currentGroup = $gName;
        }
    }
    foreach ($plan->exercises->filter(fn ($e) => $e->treatment_plan_group_id === null) as $ex) {
        $exercisePages->push(['group' => null, 'item' => $ex]);
    }

    $responsibleName = $pdfMeta['responsibleName'] ?? ($plan->clinicUser?->name ?? $plan->clinic?->name ?? config('app.name'));
    $responsibleInitials = $pdfMeta['responsibleInitials'] ?? 'FW';
    $annotationMonths = $pdfMeta['annotationMonths'] ?? [];
    $clinicName = $plan->clinic?->name ?? config('app.name');
@endphp

<div class="footer">
    &copy; {{ date('Y') }} {{ $clinicName }}. Todos os direitos reservados
</div>

{{-- ========== CAPA ========== --}}
<div class="cover">
    <table class="cover-header">
        <tr>
            <td style="width: 120px;">
                @if (! empty($pdfMeta['responsiblePhotoUrl']))
                    <img class="avatar" src="{{ $pdfMeta['responsiblePhotoUrl'] }}" width="100" height="100" alt="" />
                @else
                    <div class="avatar-fallback">{{ $responsibleInitials }}</div>
                @endif
            </td>
            <td>
                <div class="resp-name">{{ $responsibleName }}</div>
                @if (! empty($pdfMeta['responsibleCredential']))
                    <div class="resp-line">Fisioterapeuta ({{ $pdfMeta['responsibleCredential'] }})</div>
                @else
                    <div class="resp-line">Fisioterapeuta</div>
                @endif
                <div class="resp-contact">
                    @if (! empty($pdfMeta['responsiblePhone']))
                        <span>{{ $pdfMeta['responsiblePhone'] }}</span>
                    @endif
                    @if (! empty($pdfMeta['responsibleEmail']))
                        <span>{{ $pdfMeta['responsibleEmail'] }}</span>
                    @endif
                </div>
            </td>
            <td class="qr-wrap">
                @if (! empty($qrImageSrc))
                    <img src="{{ $qrImageSrc }}" width="120" height="120" alt="QR" />
                    <span>Acesse online</span>
                @endif
            </td>
        </tr>
    </table>

    <div class="cover-title">{{ $plan->title }}</div>
    <div class="cover-patient">Para: {{ $pdfMeta['patientLabel'] ?? ($plan->patient?->name ?? '—') }}</div>

    <table class="meta">
        <tr>
            <td style="width: 28%;">
                <div class="meta-label">Tempo estimado:</div>
                <div class="meta-value">
                    @if ($plan->duration_minutes)
                        {{ $plan->duration_minutes }} minuto{{ $plan->duration_minutes !== 1 ? 's' : '' }}
                    @endif
                </div>
            </td>
            <td>
                <div class="meta-label">Período de execução</div>
                <div class="meta-value">
                    {{ $periodLabel ?? '—' }}
                    @if ($daysTotal !== null)
                        <span class="meta-days">{{ $daysTotal }} dias</span>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <div class="notes-label">Observações:</div>
    @if (! empty($pdfMeta['observations']))
        <div class="notes-text">{{ $pdfMeta['observations'] }}</div>
    @endif
</div>

{{-- ========== EXERCÍCIOS (1 por página) ========== --}}
@foreach ($exercisePages as $page)
    @php
        $planExercise = $page['item'];
        $exercise = $planExercise->exercise;
        $refImages = $exercise?->media
            ? $exercise->media
                ->where('type', \Modules\Admin\Models\ExerciseMedia::TYPE_IMAGE)
                ->sortBy('sort_order')
                ->pluck('cdn_url')
                ->filter()
                ->take(2)
                ->values()
                ->all()
            : [];
        if (empty($refImages)) {
            $thumb = $exercise?->videos?->first()?->thumbnail_url;
            if (! empty($thumb)) {
                $refImages = [$thumb];
            }
        }

        $freq = $formatFreq($planExercise->days_of_week);
        $sets = $formatRange($planExercise->sets_min, $planExercise->sets_max);
        $reps = $formatRange($planExercise->repetitions_min, $planExercise->repetitions_max);
        $rest = $formatRest($planExercise->rest_time);
        $load = match (true) {
            is_null($planExercise->load_min) && is_null($planExercise->load_max) => null,
            is_null($planExercise->load_max) || $planExercise->load_min == $planExercise->load_max => (string) $planExercise->load_min,
            default => $planExercise->load_min . ' - ' . $planExercise->load_max,
        };
        $isLastExercise = $loop->last;
    @endphp

    <div class="ex-page {{ $isLastExercise ? 'ex-page-last' : '' }}">
        <div class="ex-section">Exercícios</div>
        @if (! empty($page['group']))
            <div class="ex-group">{{ $page['group'] }}</div>
        @endif

        <table class="ex-layout">
            <tr>
                <td class="ex-photos">
                    @forelse ($refImages as $imageUrl)
                        <img src="{{ $imageUrl }}" width="320" alt="" />
                    @empty
                        <div class="ph">&#9654;</div>
                    @endforelse

                    @if ($planExercise->notes)
                        <div class="ex-extra">
                            <strong>Observações adicionais:</strong> {{ $planExercise->notes }}
                        </div>
                    @endif
                </td>
                <td class="ex-body">
                    <div class="ex-name">{{ $exercise?->name ?? '—' }}</div>
                    @if ($exercise?->description)
                        <div class="ex-desc">{{ $exercise->description }}</div>
                    @endif

                    @if ($freq)
                        <div class="stat-line">Freq.: <span class="v">{{ $freq }}</span></div>
                    @endif
                    @if ($sets)
                        <div class="stat-line">Séries: <span class="v">{{ $sets }}</span></div>
                    @endif
                    @if ($reps)
                        <div class="stat-line">Repetições: <span class="v">{{ $reps }}</span></div>
                    @endif
                    @if ($load)
                        <div class="stat-line">Carga: <span class="v">{{ $load }}</span></div>
                    @endif
                    @if ($rest)
                        <div class="stat-line">Descansar: <span class="v">{{ $rest }}</span></div>
                    @endif
                </td>
            </tr>
        </table>
    </div>
@endforeach

{{-- ========== ANOTAÇÕES ========== --}}
@foreach ($annotationMonths as $month)
    @php
        $days = $month['days'] ?? [];
        // Vedius: preenche a coluna esquerda (~16 linhas) e o restante vai à direita
        $left = array_slice($days, 0, 16);
        $right = array_slice($days, 16);
    @endphp
    <div class="ann-page">
        <div class="ann-title">{{ $month['title'] }}</div>
        <div class="ann-help">
            Marque os dias em que realizou os exercícios. Quando necessário, escreva
            observações de dores ou dificuldades ao realizar um exercício.
        </div>
        <table class="ann-table">
            <tr>
                <td>
                    @foreach ($left as $day)
                        <div class="ann-row">
                            <span class="ann-box"></span>
                            <span class="ann-day">{{ $day['dayOfMonth'] }}&nbsp;&nbsp;{{ $day['weekdayShort'] }}</span>
                        </div>
                    @endforeach
                </td>
                <td>
                    @foreach ($right as $day)
                        <div class="ann-row">
                            <span class="ann-box"></span>
                            <span class="ann-day">{{ $day['dayOfMonth'] }}&nbsp;&nbsp;{{ $day['weekdayShort'] }}</span>
                        </div>
                    @endforeach
                </td>
            </tr>
        </table>
    </div>
@endforeach

</body>
</html>
