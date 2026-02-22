<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $plan->title }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
            color: #1a1a1a;
            background: #ffffff;
            line-height: 1.5;
        }

        /* ── Cabeçalho ─────────────────────────────────────── */
        .header {
            padding: 20px 30px 16px;
            border-bottom: 2px solid #0d9488;
        }

        .header-table {
            width: 100%;
        }

        .avatar-circle {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background-color: #0d9488;
            color: #ffffff;
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            line-height: 52px;
            display: inline-block;
        }

        .physio-name {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 3px;
        }

        .physio-meta {
            font-size: 9px;
            color: #475569;
            margin-bottom: 2px;
        }

        .clinic-badge {
            background-color: #f0fdfa;
            border: 1px solid #99f6e4;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
            font-size: 9px;
            color: #0d9488;
        }

        .clinic-badge-name {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
            display: block;
        }

        /* ── Título do plano ────────────────────────────────── */
        .plan-header {
            padding: 20px 30px 0;
        }

        .plan-title {
            font-size: 20px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 4px;
        }

        .plan-patient {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 16px;
        }

        /* ── Meta box (tempo / período) ─────────────────────── */
        .meta-box {
            margin: 0 30px 16px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }

        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }

        .meta-cell {
            padding: 12px 16px;
            vertical-align: top;
            width: 50%;
        }

        .meta-cell-right {
            border-left: 1px solid #e2e8f0;
        }

        .meta-label {
            font-size: 9px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 3px;
        }

        .meta-value {
            font-size: 13px;
            font-weight: bold;
            color: #0f172a;
        }

        .meta-sub {
            font-size: 9px;
            color: #64748b;
            margin-top: 1px;
        }

        /* ── Observações ────────────────────────────────────── */
        .notes-box {
            margin: 0 30px 20px;
            background: #fffbeb;
            border-left: 3px solid #f59e0b;
            border-radius: 0 6px 6px 0;
            padding: 10px 14px;
        }

        .notes-label {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            color: #92400e;
            margin-bottom: 4px;
            letter-spacing: 0.05em;
        }

        .notes-text {
            font-size: 10px;
            color: #78350f;
            line-height: 1.6;
        }

        /* ── Seção de exercícios ────────────────────────────── */
        .section-title {
            margin: 8px 30px 12px;
            font-size: 12px;
            font-weight: bold;
            color: #0d9488;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            border-bottom: 1px solid #ccfbf1;
            padding-bottom: 6px;
        }

        /* ── Nome do grupo ──────────────────────────────────── */
        .group-name {
            margin: 16px 30px 8px;
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            background: #f8fafc;
            border-left: 3px solid #0d9488;
            padding: 6px 10px;
            border-radius: 0 4px 4px 0;
        }

        /* ── Card de exercício ──────────────────────────────── */
        .exercise-card {
            margin: 0 30px 12px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .exercise-table {
            width: 100%;
            border-collapse: collapse;
        }

        .exercise-thumb-cell {
            width: 110px;
            vertical-align: top;
            padding: 0;
        }

        .exercise-thumb {
            width: 110px;
            height: 110px;
            object-fit: cover;
            display: block;
        }

        .exercise-thumb-placeholder {
            width: 110px;
            height: 110px;
            background: #f1f5f9;
            text-align: center;
            line-height: 110px;
            font-size: 32px;
            color: #94a3b8;
            display: block;
        }

        .exercise-content-cell {
            vertical-align: top;
            padding: 12px 14px;
        }

        .exercise-name {
            font-size: 12px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
        }

        .exercise-description {
            font-size: 9px;
            color: #475569;
            line-height: 1.6;
            margin-bottom: 10px;
        }

        .exercise-stats {
            width: 100%;
            border-collapse: collapse;
        }

        .stat-cell {
            vertical-align: top;
            padding-right: 12px;
            width: 25%;
        }

        .stat-label {
            font-size: 8px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 1px;
        }

        .stat-value {
            font-size: 11px;
            font-weight: bold;
            color: #0d9488;
        }

        .exercise-notes {
            margin-top: 8px;
            font-size: 9px;
            color: #64748b;
            font-style: italic;
            border-top: 1px solid #f1f5f9;
            padding-top: 6px;
        }

        /* ── Rodapé ─────────────────────────────────────────── */
        .footer {
            margin-top: 24px;
            padding: 12px 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

@php
    /** Helpers ─────────────────────────────────────────────── */
    $initials = fn(string $name): string => collect(explode(' ', $name))
        ->filter()
        ->take(2)
        ->map(fn($w) => mb_strtoupper(mb_substr($w, 0, 1)))
        ->implode('');

    $formatRange = fn(?int $min, ?int $max): string => match(true) {
        $min === null && $max === null => '—',
        $min === $max || $max === null => (string) $min,
        default => "{$min}–{$max}",
    };

    $daysMap = [
        'monday'    => 'Seg',
        'tuesday'   => 'Ter',
        'wednesday' => 'Qua',
        'thursday'  => 'Qui',
        'friday'    => 'Sex',
        'saturday'  => 'Sáb',
        'sunday'    => 'Dom',
    ];

    $formatDays = function(?array $days) use ($daysMap): string {
        if (empty($days)) return '—';
        $labels = collect($days)->map(fn($d) => $daysMap[$d] ?? $d)->implode(', ');
        return count($days) . 'x/semana (' . $labels . ')';
    };

    $formatDate = fn($date): string => $date
        ? \Carbon\Carbon::parse($date)->format('d/m/Y')
        : '—';

    $daysTotal = ($plan->start_date && $plan->end_date)
        ? (int) \Carbon\Carbon::parse($plan->start_date)->diffInDays($plan->end_date)
        : null;

    /** Achata todos os exercícios (com grupos e sem grupos) */
    $allSections = collect();

    foreach ($plan->groups as $group) {
        $allSections->push(['type' => 'group', 'name' => $group->name]);
        foreach ($group->exercises as $ex) {
            $allSections->push(['type' => 'exercise', 'item' => $ex]);
        }
    }

    $flatExercises = $plan->exercises->filter(fn($e) => $e->treatment_plan_group_id === null);
    foreach ($flatExercises as $ex) {
        $allSections->push(['type' => 'exercise', 'item' => $ex]);
    }

    $hasExercises = $allSections->where('type', 'exercise')->count() > 0;
@endphp

{{-- ── CABEÇALHO ───────────────────────────────────────────────── --}}
<div class="header">
    <table class="header-table">
        <tr>
            {{-- Avatar --}}
            <td style="width: 60px; vertical-align: middle;">
                <div class="avatar-circle">{{ $initials($plan->clinicUser?->name ?? 'FT') }}</div>
            </td>

            {{-- Dados do fisioterapeuta --}}
            <td style="vertical-align: middle; padding-left: 12px;">
                <div class="physio-name">{{ $plan->clinicUser?->name ?? '—' }}</div>
                @if($plan->clinicUser?->document)
                    <div class="physio-meta">Fisioterapeuta ({{ $plan->clinicUser->document }})</div>
                @endif
                @if($plan->clinicUser?->email)
                    <div class="physio-meta">{{ $plan->clinicUser->email }}</div>
                @endif
                @if($plan->clinic?->phone)
                    <div class="physio-meta">{{ $plan->clinic->phone }}</div>
                @endif
            </td>

            {{-- Badge da clínica --}}
            <td style="width: 130px; vertical-align: middle; text-align: right;">
                <div class="clinic-badge">
                    <span class="clinic-badge-name">{{ $plan->clinic?->name ?? config('app.name') }}</span>
                    @if($plan->clinic?->city)
                        <span style="display:block; margin-top: 2px;">{{ $plan->clinic->city }}{{ $plan->clinic?->state ? ', ' . $plan->clinic->state : '' }}</span>
                    @endif
                </div>
            </td>
        </tr>
    </table>
</div>

{{-- ── TÍTULO E PACIENTE ──────────────────────────────────────── --}}
<div class="plan-header">
    <div class="plan-title">{{ $plan->title }}</div>
    <div class="plan-patient">
        Para:
        @if($plan->patient)
            {{ $plan->patient->name }}
        @else
            <em>Sem paciente (Template)</em>
        @endif
    </div>
</div>

{{-- ── META (TEMPO + PERÍODO) ─────────────────────────────────── --}}
<div class="meta-box">
    <table class="meta-table">
        <tr>
            {{-- Tempo estimado --}}
            <td class="meta-cell">
                <div class="meta-label">Tempo estimado</div>
                <div class="meta-value">
                    @if($plan->duration_minutes)
                        {{ $plan->duration_minutes }} minuto{{ $plan->duration_minutes !== 1 ? 's' : '' }}
                    @else
                        —
                    @endif
                </div>
            </td>

            {{-- Período de execução --}}
            <td class="meta-cell meta-cell-right">
                <div class="meta-label">Período de execução</div>
                <div class="meta-value">
                    {{ $formatDate($plan->start_date) }}
                    @if($plan->end_date)
                        &nbsp;→&nbsp;{{ $formatDate($plan->end_date) }}
                    @endif
                </div>
                @if($daysTotal !== null)
                    <div class="meta-sub">{{ $daysTotal }} dias</div>
                @endif
            </td>
        </tr>
    </table>
</div>

{{-- ── OBSERVAÇÕES ─────────────────────────────────────────────── --}}
@if($plan->notes || $plan->message)
    <div class="notes-box">
        <div class="notes-label">Observações</div>
        <div class="notes-text">{{ $plan->notes ?? $plan->message }}</div>
    </div>
@endif

{{-- ── EXERCÍCIOS ──────────────────────────────────────────────── --}}
@if($hasExercises)
    <div class="section-title">Exercícios</div>

    @foreach($allSections as $section)

        @if($section['type'] === 'group')
            <div class="group-name">{{ $section['name'] }}</div>

        @elseif($section['type'] === 'exercise')
            @php
                /** @var \Modules\Clinic\Models\TreatmentPlanExercise $planExercise */
                $planExercise = $section['item'];
                $exercise     = $planExercise->exercise;
                $thumbnail    = $exercise?->videos?->first()?->thumbnail_url;
            @endphp

            <div class="exercise-card">
                <table class="exercise-table">
                    <tr>
                        {{-- Thumbnail --}}
                        <td class="exercise-thumb-cell">
                            @if($thumbnail)
                                <img
                                    src="{{ $thumbnail }}"
                                    class="exercise-thumb"
                                    alt="{{ $exercise->name }}"
                                />
                            @else
                                <div class="exercise-thumb-placeholder">&#9654;</div>
                            @endif
                        </td>

                        {{-- Conteúdo --}}
                        <td class="exercise-content-cell">
                            <div class="exercise-name">{{ $exercise?->name ?? '—' }}</div>

                            @if($exercise?->description)
                                <div class="exercise-description">{{ $exercise->description }}</div>
                            @endif

                            {{-- Estatísticas --}}
                            <table class="exercise-stats">
                                <tr>
                                    <td class="stat-cell">
                                        <div class="stat-label">Freq.</div>
                                        <div class="stat-value">{{ $formatDays($planExercise->days_of_week) }}</div>
                                    </td>
                                    <td class="stat-cell">
                                        <div class="stat-label">Séries</div>
                                        <div class="stat-value">{{ $formatRange($planExercise->sets_min, $planExercise->sets_max) }}</div>
                                    </td>
                                    <td class="stat-cell">
                                        <div class="stat-label">Repetições</div>
                                        <div class="stat-value">{{ $formatRange($planExercise->repetitions_min, $planExercise->repetitions_max) }}</div>
                                    </td>
                                    <td class="stat-cell">
                                        <div class="stat-label">Descanso</div>
                                        <div class="stat-value">
                                            {{ $planExercise->rest_time ? $planExercise->rest_time . 's' : '—' }}
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            @if($planExercise->notes)
                                <div class="exercise-notes">{{ $planExercise->notes }}</div>
                            @endif
                        </td>
                    </tr>
                </table>
            </div>
        @endif

    @endforeach
@endif

{{-- ── RODAPÉ ──────────────────────────────────────────────────── --}}
<div class="footer">
    &copy; {{ date('Y') }} {{ $plan->clinic?->name ?? config('app.name') }}. Todos os direitos reservados
</div>

</body>
</html>
