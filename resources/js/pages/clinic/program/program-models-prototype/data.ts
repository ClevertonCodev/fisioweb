/**
 * PROTÓTIPO (descartável): os dois tipos de modelo numa forma só.
 *
 * - "Nossos modelos": catálogo do admin (GET /clinic/programs). A lista
 *   traz área e contagem; grupos e vídeos só no detalhe.
 * - "Meus modelos": programas da clínica sem paciente
 *   (GET /clinic/treatment-plans?without_patient=1).
 *
 * Dados reais (até 200 de cada); busca e filtros são locais. Na tela de
 * verdade viram parâmetros da API (search e physio_area_id já existem).
 */
import { useQuery } from '@tanstack/react-query';

import {
    listClinicProgramsLibraryPaginated,
    useClinicProgramLibraryDetail,
} from '@/application/clinic/use-clinic-programs-library';
import {
    listMyModelsPaginated,
    useClinicProgram,
} from '@/application/clinic/use-programs';
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
    /** O objeto que a v1 manda para /clinica/programas/novo. */
    source: AdminProgram | Program;
}

// ---------------------------------------------------------------- mapeamento

function fromLibrary(p: AdminProgram & { exercisesCount?: number }) {
    return {
        key: `nossos-${p.id}`,
        origin: 'nossos' as const,
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

function fromMine(p: Program): ModelSummary {
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

function libraryExercise(e: AdminProgramExercise): ModelExercise {
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

function myExercise(e: ProgramExercise): ModelExercise {
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

// ---------------------------------------------------------------- dados

export function useModels() {
    const library = useQuery({
        queryKey: ['clinic', 'programs-library', 'prototype-all'],
        queryFn: () => listClinicProgramsLibraryPaginated({ perPage: 200 }),
    });
    const mine = useQuery({
        queryKey: ['clinic-programs', 'prototype-my-models'],
        queryFn: () => listMyModelsPaginated({ perPage: 200 }),
    });
    const models: ModelSummary[] = [
        ...(library.data?.data ?? []).map(fromLibrary),
        ...(mine.data?.items ?? []).map(fromMine),
    ];
    return {
        models,
        isLoading: library.isLoading || mine.isLoading,
        isError: library.isError && mine.isError,
    };
}

/** Grupos e vídeos de um modelo; a consulta é a mesma da v1 (cache comum). */
export function useModelDetail(model: ModelSummary | null): {
    detail: ModelDetail | null;
    isLoading: boolean;
} {
    const lib = useClinicProgramLibraryDetail(
        model?.origin === 'nossos' ? Number(model.id) : null,
    );
    const mine = useClinicProgram(
        model?.origin === 'meus' ? model.id : undefined,
    );
    if (!model) return { detail: null, isLoading: false };
    if (model.origin === 'nossos') {
        const p = lib.data;
        return {
            isLoading: lib.isLoading,
            detail: p
                ? {
                      ...model,
                      ...fromLibrary(p),
                      groups: (p.groups ?? []).map((g) => ({
                          id: String(g.id),
                          name: g.name,
                          exercises: (g.exercises ?? []).map(libraryExercise),
                      })),
                      source: p,
                  }
                : null,
        };
    }
    const p = mine.data;
    return {
        isLoading: mine.isLoading,
        detail: p
            ? {
                  ...model,
                  ...fromMine(p),
                  groups: p.groups.map((g) => ({
                      id: g.id,
                      name: g.name,
                      exercises: g.exercises.map(myExercise),
                  })),
                  source: p,
              }
            : null,
    };
}

// ---------------------------------------------------------------- prescrição

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

/** "3 séries · 10 repetições · 2 kg · 30 s de descanso", em pedaços. */
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

/** Dias e período ("Seg, Qua, Sex · Manhã"). */
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

// ---------------------------------------------------------------- filtros

/** A origem não é filtro: é a aba (Nossos modelos / Meus modelos). */
export interface ModelFilters {
    search: string;
    areas: string[];
}

export const INITIAL_FILTERS: ModelFilters = {
    search: '',
    areas: [],
};

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

export function applyFilters(
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

export function activeFilterCount(f: ModelFilters): number {
    return f.areas.length;
}

export function chipsOf(f: ModelFilters) {
    return f.areas.map((a) => ({
        key: a,
        label: 'Especialidade',
        value: a,
    }));
}

export function removeChip(f: ModelFilters, key: string): ModelFilters {
    return { ...f, areas: f.areas.filter((a) => a !== key) };
}

export function exercisesOf(detail: ModelDetail | null): ModelExercise[] {
    return detail?.groups.flatMap((g) => g.exercises) ?? [];
}

// ---------------------------------------------------------------- regiões

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

/**
 * PROTÓTIPO: a região sai de palavras do título e da descrição. Na tela de
 * verdade, viria do modelo (ou da região dos exercícios dele, que o
 * catálogo já tem).
 */
export function regionsOf(m: ModelSummary): Region[] {
    const text = normalize(`${m.title} ${m.description}`);
    return REGION_WORDS.filter(([, re]) => re.test(text)).map(([r]) => r);
}
