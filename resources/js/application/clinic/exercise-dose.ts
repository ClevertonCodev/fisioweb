/**
 * Dose e agenda de um exercício em texto, iguais no painel do programa, no
 * montador e na aba Modelos. Cada tela adapta os próprios campos para cá.
 */
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

/** "3 séries · 10 repetições · 2 kg · 30 s de descanso", em pedaços. */
export function doseFrom(d: DoseInput): DosePart[] {
    const sets = range(d.setsMin, d.setsMax);
    const reps = range(d.repsMin, d.repsMax);
    // Carga 0 e descanso 0 são "sem carga" e "sem descanso": não viram pedaço.
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

/** "Seg, Qua, Sex"; os sete viram "Todos os dias"; sem dias, null. */
export function daysLabel(days: number[]): string | null {
    if (days.length === 0) return null;
    if (days.length === 7) return 'Todos os dias';
    return [...days]
        .sort()
        .map((d) => WEEKDAYS[d])
        .join(', ');
}

/** Dias e período juntos: "Seg, Sex · Manhã". */
export function scheduleText(
    days: string | null,
    period: ExercisePeriod | null,
): string {
    return [days, period ? PERIOD[period] : null].filter(Boolean).join(' · ');
}
