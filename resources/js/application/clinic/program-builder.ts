/**
 * O estado do assistente de programa (novo, edição e modelo), sem tela. Os
 * grupos existem desde o começo, e um deles recebe os exercícios marcados na
 * biblioteca. O programa que chega (modelo, exercício ou o próprio programa
 * na edição) vira grupos aqui.
 */
import { useState } from 'react';

import { programExerciseFrom } from '@/application/clinic/program-from-exercise';
import type { Exercise, ProgramExercise, ProgramGroup } from '@/domain/clinic';

export const FIRST_GROUP_NAME = 'Exercícios';

export function fromExercise(e: Exercise): ProgramExercise {
    return programExerciseFrom(e, nextId(e.id));
}

/** Tem dose de verdade: séries ou repetições definidas. */
export function hasDose(
    e: Pick<
        ProgramExercise,
        'seriesMin' | 'seriesMax' | 'repetitionsMin' | 'repetitionsMax'
    >,
): boolean {
    return [e.seriesMin, e.seriesMax, e.repetitionsMin, e.repetitionsMax].some(
        (v) => v != null,
    );
}

// ---------------------------------------------------------------- entrada

type Raw = Record<string, unknown>;

const str = (v: unknown) => (v == null ? '' : String(v));
/** Primeiro valor numérico; dado legado como "60s" vira 60, lixo vira null. */
const num = (...vs: unknown[]) => {
    const v = vs.find((x) => x != null);
    if (v == null) return null;
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
};
const ADMIN_PERIOD: Record<string, ProgramExercise['period']> = {
    morning: 'manha',
    afternoon: 'tarde',
    night: 'noite',
    manha: 'manha',
    tarde: 'tarde',
    noite: 'noite',
};

/**
 * O programa que chega (modelo do sistema, modelo da clínica, exercício ou o
 * próprio programa na edição) vira grupos do assistente. O modelo do sistema
 * vem no formato do admin, daí os campos alternativos.
 */
export function fromIncoming(
    program: Raw | undefined,
    keepTitle: boolean,
): { title: string; message: string; groups: ProgramGroup[] } | null {
    const groups = program?.groups as Raw[] | undefined;
    if (!program || !groups) return null;
    const title = str(program.title);
    // Programa salvo usado como base vira "(Cópia)"; exercício (sem id),
    // edição e modelo mantêm o nome.
    const copy = !keepTitle && str(program.id) !== '';
    return {
        title: title && copy ? `${title} (Cópia)` : title,
        message: str(program.message) || str(program.description),
        groups: groups.map((g, gi) => ({
            id: str(g.id) || `grupo-${gi}`,
            name: str(g.name),
            exercises: ((g.exercises as Raw[] | undefined) ?? []).map(
                (ex, ei) => {
                    const inner = (ex.exercise as Raw | undefined) ?? {};
                    const exercise = {
                        id: str(ex.id) || `grupo-${gi}-ex-${ei}`,
                        exerciseId: str(ex.exerciseId) || str(inner.id),
                        title: str(ex.title) || str(inner.name),
                        thumbnailUrl:
                            str(ex.thumbnailUrl) || str(inner.thumbnailUrl),
                        videoUrl: str(ex.videoUrl) || str(inner.videoUrl),
                        days:
                            (ex.days as number[] | undefined) ??
                            (ex.daysOfWeek as number[] | undefined) ??
                            [],
                        period: ADMIN_PERIOD[str(ex.period)] ?? null,
                        seriesMin: num(ex.seriesMin, ex.setsMin),
                        seriesMax: num(ex.seriesMax, ex.setsMax),
                        repetitionsMin: num(
                            ex.repetitionsMin,
                            ex.repetitions_min,
                        ),
                        repetitionsMax: num(
                            ex.repetitionsMax,
                            ex.repetitions_max,
                        ),
                        loadMin: num(ex.loadMin, ex.load_min),
                        loadMax: num(ex.loadMax, ex.load_max),
                        restTime: num(ex.restTime, ex.rest_time),
                        notes: (ex.notes as string | null) ?? null,
                    };
                    return { ...exercise, isConfigured: hasDose(exercise) };
                },
            ),
        })),
    };
}

// ---------------------------------------------------------------- estado

let seq = 0;
/** Id local de grupo ou exercício ainda não salvo. */
function nextId(prefix: string) {
    return `${prefix}-${Date.now()}-${++seq}`;
}

/** A dose de um exercício (o que o painel edita). */
export type Dose = Pick<
    ProgramExercise,
    | 'days'
    | 'period'
    | 'seriesMin'
    | 'seriesMax'
    | 'repetitionsMin'
    | 'repetitionsMax'
    | 'loadMin'
    | 'loadMax'
    | 'restTime'
    | 'notes'
>;

export function useProgramBuilder(initial: ProgramGroup[]) {
    const [groups, setGroups] = useState<ProgramGroup[]>(() =>
        initial.length > 0
            ? initial
            : [{ id: 'grupo-1', name: FIRST_GROUP_NAME, exercises: [] }],
    );
    const [targetId, setTargetId] = useState<string>(
        () => initial[0]?.id ?? 'grupo-1',
    );
    // O grupo alvo some se for excluído: cai no primeiro.
    const target = groups.find((g) => g.id === targetId) ?? groups[0];

    const mapGroup = (id: string, fn: (g: ProgramGroup) => ProgramGroup) =>
        setGroups((prev) => prev.map((g) => (g.id === id ? fn(g) : g)));

    const isSelected = (e: Exercise) =>
        groups.some((g) => g.exercises.some((x) => x.exerciseId === e.id));

    const total = groups.reduce((n, g) => n + g.exercises.length, 0);
    const configured = groups.reduce(
        (n, g) => n + g.exercises.filter((e) => e.isConfigured).length,
        0,
    );

    return {
        groups,
        setGroups,
        target,
        setTargetId,
        isSelected,
        total,
        configured,

        /** Marcar na biblioteca: entra no grupo alvo; desmarcar tira de todos. */
        toggle(e: Exercise) {
            if (isSelected(e)) {
                setGroups((prev) =>
                    prev.map((g) => ({
                        ...g,
                        exercises: g.exercises.filter(
                            (x) => x.exerciseId !== e.id,
                        ),
                    })),
                );
                return;
            }
            if (!target) return;
            mapGroup(target.id, (g) => ({
                ...g,
                exercises: [...g.exercises, fromExercise(e)],
            }));
        },

        addGroup(name = 'Novo grupo') {
            const id = nextId('grupo');
            setGroups((prev) => [...prev, { id, name, exercises: [] }]);
            setTargetId(id);
            return id;
        },
        renameGroup(id: string, name: string) {
            mapGroup(id, (g) => ({ ...g, name }));
        },
        removeGroup(id: string) {
            setGroups((prev) => {
                const next = prev.filter((g) => g.id !== id);
                return next.length > 0
                    ? next
                    : [
                          {
                              id: nextId('grupo'),
                              name: FIRST_GROUP_NAME,
                              exercises: [],
                          },
                      ];
            });
        },
        duplicateGroup(id: string) {
            setGroups((prev) => {
                const i = prev.findIndex((g) => g.id === id);
                const g = prev[i];
                if (!g) return prev;
                const copy: ProgramGroup = {
                    id: nextId('grupo'),
                    name: `${g.name} (cópia)`,
                    exercises: g.exercises.map((e) => ({
                        ...e,
                        id: nextId(e.exerciseId),
                    })),
                };
                return [...prev.slice(0, i + 1), copy, ...prev.slice(i + 1)];
            });
        },

        removeExercise(groupId: string, id: string) {
            mapGroup(groupId, (g) => ({
                ...g,
                exercises: g.exercises.filter((e) => e.id !== id),
            }));
        },
        duplicateExercise(groupId: string, id: string) {
            mapGroup(groupId, (g) => {
                const i = g.exercises.findIndex((e) => e.id === id);
                const e = g.exercises[i];
                if (!e) return g;
                const copy = { ...e, id: nextId(e.exerciseId) };
                return {
                    ...g,
                    exercises: [
                        ...g.exercises.slice(0, i + 1),
                        copy,
                        ...g.exercises.slice(i + 1),
                    ],
                };
            });
        },
        setDose(groupId: string, id: string, dose: Dose) {
            mapGroup(groupId, (g) => ({
                ...g,
                exercises: g.exercises.map((e) =>
                    e.id === id ? { ...e, ...dose, isConfigured: true } : e,
                ),
            }));
        },
        /** Novo: a mesma dose para o grupo inteiro de uma vez. */
        setGroupDose(groupId: string, dose: Dose) {
            mapGroup(groupId, (g) => ({
                ...g,
                exercises: g.exercises.map((e) => ({
                    ...e,
                    ...dose,
                    isConfigured: true,
                })),
            }));
        },
    };
}

export type ProgramBuilder = ReturnType<typeof useProgramBuilder>;

// ---------------------------------------------------------------- textos

export function exerciseCount(n: number): string {
    return `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;
}
