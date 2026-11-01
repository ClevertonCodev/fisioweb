const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PERIOD = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' } as const;

export type ExercisePeriod = keyof typeof PERIOD;

type Num = number | null | undefined;

export interface DoseInput {
    setsMin: Num;
    setsMax: Num;
    repsMin: Num;
    repsMax: Num;
    loadMin: Num;
    loadMax: Num;
    restTime: Num;
}

export interface DosePart {
    key: string;
    value: string;
    unit: string;
}

function range(min: Num, max: Num) {
    if (min == null && max == null) return null;
    if (min != null && max != null && min !== max) return `${min}–${max}`;
    return String(min ?? max);
}

export function doseFrom(d: DoseInput): DosePart[] {
    const sets = range(d.setsMin, d.setsMax);
    const reps = range(d.repsMin, d.repsMax);
    const load = d.loadMin || d.loadMax ? range(d.loadMin, d.loadMax) : null;
    return [
        sets && {
            key: 'sets',
            value: sets,
            unit: sets === '1' ? 'série' : 'séries',
        },
        reps && {
            key: 'reps',
            value: reps,
            unit: reps === '1' ? 'repetição' : 'repetições',
        },
        load && { key: 'load', value: load, unit: 'kg' },
        !!d.restTime && {
            key: 'rest',
            value: `${d.restTime} s`,
            unit: 'de descanso',
        },
    ].filter(Boolean) as DosePart[];
}

export function daysLabel(days: number[]): string | null {
    if (days.length === 0) return null;
    if (days.length === 7) return 'Todos os dias';
    return [...days]
        .sort()
        .map((d) => WEEKDAYS[d])
        .join(', ');
}

export function scheduleText(
    days: string | null,
    period: ExercisePeriod | null,
): string {
    return [days, period ? PERIOD[period] : null].filter(Boolean).join(' · ');
}
