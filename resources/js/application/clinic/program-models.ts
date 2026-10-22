import type { AdminProgram, AdminProgramExercise } from '@/domain/admin';
import type { Program, ProgramExercise } from '@/domain/clinic';

export type Origin = 'nossos' | 'meus';

export interface ModelSummary {
    key: string;
    origin: Origin;
    id: string;
    title: string;
    description: string;
    area: string | null;
    exerciseCount: number;
    durationMinutes: number | null;
    author: string | null;
    createdAt: string | null;
}

export interface ModelExercise {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoUrl: string;
    days: number[];
    period: 'manha' | 'tarde' | 'noite' | null;
    setsMin: number | null;
    setsMax: number | null;
    repsMin: number | null;
    repsMax: number | null;
    loadMin: number | null;
    loadMax: number | null;
    restTime: number | null;
    notes: string | null;
}

export interface ModelGroup {
    id: string;
    name: string;
    exercises: ModelExercise[];
}

export interface ModelDetail extends ModelSummary {
    groups: ModelGroup[];
    source: AdminProgram | Program;
}

export function fromLibrary(
    p: AdminProgram & { exercisesCount?: number },
): ModelSummary {
    return {
        key: `nossos-${p.id}`,
        origin: 'nossos',
        id: String(p.id),
        title: p.title,
        description: p.description ?? '',
        area: p.physioArea?.name ?? null,
        exerciseCount:
            p.groups?.reduce((n, g) => n + (g.exercises?.length ?? 0), 0) ??
            p.exercisesCount ??
            0,
        durationMinutes: p.durationMinutes,
        author: p.createdBy?.name ?? null,
        createdAt: null,
    };
}

export function fromMine(p: Program): ModelSummary {
    return {
        key: `meus-${p.id}`,
        origin: 'meus',
        id: p.id,
        title: p.title,
        description: p.message ?? '',
        area: null,
        exerciseCount: p.groups.length
            ? p.groups.reduce((n, g) => n + g.exercises.length, 0)
            : p.exerciseCount,
        durationMinutes: null,
        author: p.professionalName,
        createdAt: p.createdAt || null,
    };
}

const ADMIN_PERIOD = {
    morning: 'manha',
    afternoon: 'tarde',
    night: 'noite',
} as const;

export function libraryExercise(e: AdminProgramExercise): ModelExercise {
    return {
        id: String(e.id),
        title: e.exercise?.name ?? 'Exercício',
        thumbnailUrl: e.exercise?.thumbnailUrl ?? '',
        videoUrl: e.exercise?.videoUrl ?? '',
        days: e.daysOfWeek ?? [],
        period: e.period ? ADMIN_PERIOD[e.period] : null,
        setsMin: e.setsMin,
        setsMax: e.setsMax,
        repsMin: e.repetitionsMin,
        repsMax: e.repetitionsMax,
        loadMin: e.loadMin,
        loadMax: e.loadMax,
        restTime: e.restTime,
        notes: e.notes,
    };
}

export function myExercise(e: ProgramExercise): ModelExercise {
    return {
        id: e.id,
        title: e.title,
        thumbnailUrl: e.thumbnailUrl,
        videoUrl: e.videoUrl,
        days: e.days ?? [],
        period: e.period,
        setsMin: e.seriesMin,
        setsMax: e.seriesMax,
        repsMin: e.repetitionsMin ?? null,
        repsMax: e.repetitionsMax ?? null,
        loadMin: e.loadMin ?? null,
        loadMax: e.loadMax ?? null,
        restTime: e.restTime ?? null,
        notes: e.notes ?? null,
    };
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const PERIOD = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite' } as const;

function range(min: number | null, max: number | null): string | null {
    if (min == null && max == null) return null;
    if (min != null && max != null && min !== max) return `${min}–${max}`;
    return String(min ?? max);
}

export function daysLabel(days: number[]): string | null {
    if (days.length === 0) return null;
    if (days.length === 7) return 'Todos os dias';
    return [...days]
        .sort()
        .map((d) => DAYS[d])
        .join(', ');
}

export interface Dose {
    key: string;
    value: string;
    unit: string;
}

export function doseOf(e: ModelExercise): Dose[] {
    const sets = range(e.setsMin, e.setsMax);
    const reps = range(e.repsMin, e.repsMax);
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
    ].filter(Boolean) as Dose[];
}

export function scheduleOf(e: ModelExercise): string | null {
    const parts = [daysLabel(e.days), e.period ? PERIOD[e.period] : null];
    const text = parts.filter(Boolean).join(' · ');
    return text || null;
}

export function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('pt-BR');
}

export interface ModelFilters {
    search: string;
    areas: string[];
}

export const INITIAL_MODEL_FILTERS: ModelFilters = {
    search: '',
    areas: [],
};

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

export function applyModelFilters(
    models: ModelSummary[],
    f: ModelFilters,
): ModelSummary[] {
    const q = normalize(f.search.trim());
    return models.filter(
        (m) =>
            (f.areas.length === 0 || (m.area && f.areas.includes(m.area))) &&
            (!q ||
                normalize(
                    [m.title, m.description, m.area, m.author].join(' '),
                ).includes(q)),
    );
}

export function areaOptions(models: ModelSummary[]): string[] {
    return [
        ...new Set(models.map((m) => m.area).filter(Boolean) as string[]),
    ].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function activeModelFilterCount(f: ModelFilters): number {
    return f.areas.length;
}

export function modelChips(f: ModelFilters) {
    return f.areas.map((a) => ({
        key: a,
        label: 'Especialidade',
        value: a,
    }));
}

export function removeModelChip(f: ModelFilters, key: string): ModelFilters {
    return { ...f, areas: f.areas.filter((a) => a !== key) };
}

export function exercisesOf(detail: ModelDetail | null): ModelExercise[] {
    return detail?.groups.flatMap((g) => g.exercises) ?? [];
}

export type Region =
    | 'cervical'
    | 'ombro'
    | 'lombar'
    | 'quadril'
    | 'joelho'
    | 'tornozelo'
    | 'equilibrio';

export const REGIONS: { key: Region; label: string }[] = [
    { key: 'cervical', label: 'Cervical' },
    { key: 'ombro', label: 'Ombro' },
    { key: 'lombar', label: 'Lombar' },
    { key: 'quadril', label: 'Quadril' },
    { key: 'joelho', label: 'Joelho' },
    { key: 'tornozelo', label: 'Tornozelo' },
    { key: 'equilibrio', label: 'Equilíbrio e corpo todo' },
];

const REGION_WORDS: [Region, RegExp][] = [
    ['cervical', /cervical|pescoc|cabeca/],
    ['ombro', /ombro|manguito/],
    ['lombar', /lombar|lombalgia|coluna/],
    ['quadril', /quadril|gluteo/],
    ['joelho', /joelho|lca|patel|menisco/],
    ['tornozelo', /tornozelo|entorse/],
    ['equilibrio', /queda|equilibrio|idoso/],
];

/** Heurística: região sai de palavras do título e da descrição. */
export function regionsOf(m: ModelSummary): Region[] {
    const text = normalize(`${m.title} ${m.description}`);
    return REGION_WORDS.filter(([, re]) => re.test(text)).map(([r]) => r);
}
