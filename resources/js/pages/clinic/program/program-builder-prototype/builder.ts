/**
 * PROTÓTIPO (descartável): o estado do assistente de programa, sem tela.
 * Os grupos existem desde o começo (a v1 só cria o grupo na etapa 2), e
 * um deles recebe os exercícios marcados na biblioteca. A entrada por
 * modelo, cópia ou edição segue as regras da v1 (ProgramNewPage).
 */
import { useState } from 'react';

import type { Exercise, ProgramExercise, ProgramGroup } from '@/domain/clinic';

export const FIRST_GROUP_NAME = 'Exercícios';

export function fromExercise(e: Exercise): ProgramExercise {
    return {
        id: `${e.id}-${Date.now()}`,
        exerciseId: e.id,
        title: e.title,
        thumbnailUrl: e.thumbnailUrl,
        videoUrl: e.videoUrl,
        days: [],
        period: null,
        seriesMin: null,
        seriesMax: null,
        repetitionsMin: null,
        repetitionsMax: null,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: null,
        isConfigured: false,
    };
}

// ---------------------------------------------------------------- entrada

type Raw = Record<string, unknown>;

const str = (v: unknown) => (v == null ? '' : String(v));
const num = (...vs: unknown[]) => {
    const v = vs.find((x) => x != null);
    return v == null ? null : Number(v);
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
 * O programa que chega pela navegação (modelo, cópia ou edição), no
 * formato do domínio ou cru da API, vira grupos do assistente.
 */
export function fromIncoming(
    program: Raw | undefined,
    editMode: boolean,
): { title: string; message: string; groups: ProgramGroup[] } | null {
    const groups = program?.groups as Raw[] | undefined;
    if (!program || !groups) return null;
    const title = str(program.title);
    return {
        title: title ? (editMode ? title : `${title} (Cópia)`) : '',
        message: str(program.message) || str(program.description),
        groups: groups.map((g, gi) => ({
            id: str(g.id) || `grupo-${gi}`,
            name: str(g.name),
            exercises: ((g.exercises as Raw[] | undefined) ?? []).map(
                (ex, ei) => {
                    const inner = (ex.exercise as Raw | undefined) ?? {};
                    return {
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
                        isConfigured: true,
                    };
                },
            ),
        })),
    };
}

// ---------------------------------------------------------------- estado

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

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${++seq}`;

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
    const load = range(e.loadMin, e.loadMax);
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
        e.restTime != null && {
            key: 'rest',
            value: `${e.restTime} s`,
            unit: 'de descanso',
        },
    ].filter(Boolean) as DosePart[];
}

/** "Seg, Qua, Sex · Manhã". */
export function scheduleOf(e: ProgramExercise): string | null {
    const days =
        e.days.length === 7
            ? 'Todos os dias'
            : [...e.days]
                  .sort()
                  .map((d) => DAYS[d])
                  .join(', ');
    const text = [days, e.period ? PERIOD[e.period] : null]
        .filter(Boolean)
        .join(' · ');
    return text || null;
}

export function exerciseCount(n: number): string {
    return `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;
}
