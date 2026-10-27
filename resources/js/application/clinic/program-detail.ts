import { validityOf } from '@/application/clinic/program-history-filters';
import type { Program, ProgramExercise } from '@/domain/clinic';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PERIOD = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' } as const;

function range(min: number | null | undefined, max: number | null | undefined) {
    if (min == null && max == null) return null;
    if (min != null && max != null && min !== max) return `${min}–${max}`;
    return String(min ?? max);
}

export interface DosePart {
    key: string;
    value: string;
    unit: string;
}

/** "3 séries · 10 repetições · 2 kg · 30 s de descanso", em pedaços. */
export function doseParts(e: ProgramExercise): DosePart[] {
    const sets = range(e.seriesMin, e.seriesMax);
    const reps = range(e.repetitionsMin, e.repetitionsMax);
    // Carga 0 e descanso 0 são "sem carga" e "sem descanso": não viram pedaço.
    const load = e.loadMin || e.loadMax ? range(e.loadMin, e.loadMax) : null;
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
        !!e.restTime && {
            key: 'rest',
            value: `${e.restTime} s`,
            unit: 'de descanso',
        },
    ].filter(Boolean) as DosePart[];
}

/** "Seg, Qua, Sex · Manhã". Sem dias marcados, o exercício é de todo dia. */
export function scheduleOf(e: ProgramExercise): string {
    const days =
        e.days.length === 0 || e.days.length === 7
            ? 'Todos os dias'
            : [...e.days]
                  .sort()
                  .map((d) => DAYS[d])
                  .join(', ');
    return [days, e.period ? PERIOD[e.period] : null]
        .filter(Boolean)
        .join(' · ');
}

export type PanelStatKey = 'exercises' | 'validity' | 'completed' | 'viewed';

export interface PanelStat {
    key: PanelStatKey;
    label: string;
    value: string;
}

export interface ProgramPanel {
    stats: PanelStat[];
    isDraft: boolean;
}

function days(n: number): string {
    return `${n} ${n === 1 ? 'dia' : 'dias'}`;
}

function validityStat(program: Program): PanelStat {
    const { daysLeft } = validityOf(program);
    if (daysLeft == null) {
        return { key: 'validity', label: 'Término', value: 'Sem fim' };
    }
    if (daysLeft < 0) {
        return {
            key: 'validity',
            label: 'Terminou há',
            value: days(Math.abs(daysLeft)),
        };
    }
    if (daysLeft === 0) {
        return { key: 'validity', label: 'Termina', value: 'Hoje' };
    }
    return { key: 'validity', label: 'Faltam', value: days(daysLeft) };
}

/**
 * Os números do topo do painel do programa. O rascunho ainda não chegou ao
 * paciente: validade, conclusões e abertura não dizem nada, então fica só a
 * contagem de exercícios e a tela mostra o aviso.
 */
export function programPanel(program: Program): ProgramPanel {
    const total = program.groups.reduce((n, g) => n + g.exercises.length, 0);
    const exercises: PanelStat = {
        key: 'exercises',
        label: 'Exercícios',
        value: String(total),
    };
    if (program.status === 'draft') {
        return { isDraft: true, stats: [exercises] };
    }
    return {
        isDraft: false,
        stats: [
            exercises,
            validityStat(program),
            {
                key: 'completed',
                label: 'Vezes que completou',
                value: String(program.patientCompletedCount),
            },
            {
                key: 'viewed',
                label: 'Paciente abriu',
                value: program.patientViewedAt
                    ? // "28/09/26": o ano com quatro dígitos estoura o cartão no celular.
                      new Date(program.patientViewedAt).toLocaleDateString(
                          'pt-BR',
                          { day: '2-digit', month: '2-digit', year: '2-digit' },
                      )
                    : 'Ainda não',
            },
        ],
    };
}

/** Estado de navegação de quem abre o programa: de onde a pessoa veio. */
export interface ProgramOrigin {
    from: string;
}

const PROGRAM_BACK_FALLBACK = '/clinica/programas/historico';

/**
 * Para onde o botão "Voltar" leva. Só aceita caminho da própria área da
 * clínica: o `state` da navegação pode vir de qualquer lugar.
 */
export function programBackPath(state: unknown): string {
    const from = (state as Partial<ProgramOrigin> | null)?.from;
    if (typeof from === 'string' && from.startsWith('/clinica/')) {
        return from;
    }
    return PROGRAM_BACK_FALLBACK;
}
