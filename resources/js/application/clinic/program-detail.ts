import {
    daysLabel,
    doseFrom,
    type DosePart,
    scheduleText,
} from '@/application/clinic/exercise-dose';
import { validityOf } from '@/application/clinic/program-history-filters';
import type { Program, ProgramExercise } from '@/domain/clinic';

export type { DosePart };

/** "3 séries · 10 repetições · 2 kg · 30 s de descanso", em pedaços. */
export function doseParts(e: ProgramExercise): DosePart[] {
    return doseFrom({
        setsMin: e.seriesMin,
        setsMax: e.seriesMax,
        repsMin: e.repetitionsMin,
        repsMax: e.repetitionsMax,
        loadMin: e.loadMin,
        loadMax: e.loadMax,
        restTime: e.restTime,
    });
}

/** "Seg, Qua, Sex · Manhã". Sem dias marcados, o exercício é de todo dia. */
export function scheduleOf(e: ProgramExercise): string {
    return scheduleText(daysLabel(e.days) ?? 'Todos os dias', e.period);
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
