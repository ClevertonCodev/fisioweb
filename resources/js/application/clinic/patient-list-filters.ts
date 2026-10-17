import type { PatientListParams } from '@/application/clinic/ports';
import type { PatientStatus } from '@/domain/clinic/patient';

/**
 * Estado da lista de pacientes guardado na URL. Ler e escrever são funções
 * puras: valor inválido na URL cai no padrão, e valor padrão não vai para a URL.
 *
 * ?q=maria&situacao=ativos|inativos&status=alta,obito&prof=12,34
 *  &de=2026-01-01&ate=2026-03-31&page=2&per_page=30
 */
export const PATIENT_LIST_PER_PAGE_OPTIONS = [15, 30, 50] as const;

/** "todos" = ativos e inativos. */
export type PatientSituation = 'todos' | 'ativos' | 'inativos';

const PATIENT_STATUSES: readonly PatientStatus[] = [
    'em_tratamento',
    'em_treinamento',
    'em_prevencao',
    'alta',
    'cancelado',
    'obito',
];

export interface PatientListFilters {
    search: string;
    page: number;
    perPage: number;
    situation: PatientSituation;
    statuses: PatientStatus[];
    professionalIds: string[];
    /** Data ISO (AAAA-MM-DD), sem fuso. */
    dateFrom: string | null;
    dateTo: string | null;
}

export const DEFAULT_PATIENT_LIST_FILTERS: PatientListFilters = {
    search: '',
    page: 1,
    perPage: 15,
    situation: 'todos',
    statuses: [],
    professionalIds: [],
    dateFrom: null,
    dateTo: null,
};

function parsePositiveInt(raw: string | null): number | null {
    if (!raw || !/^\d+$/.test(raw)) return null;
    const n = Number(raw);
    return n >= 1 ? n : null;
}

function parsePerPage(raw: string | null): number {
    const n = parsePositiveInt(raw);
    return n !== null &&
        (PATIENT_LIST_PER_PAGE_OPTIONS as readonly number[]).includes(n)
        ? n
        : DEFAULT_PATIENT_LIST_FILTERS.perPage;
}

function parseSituation(raw: string | null): PatientSituation {
    return raw === 'ativos' || raw === 'inativos' ? raw : 'todos';
}

function parseList(raw: string | null): string[] {
    return [...new Set((raw ?? '').split(',').filter(Boolean))];
}

/** AAAA-MM-DD que existe no calendário (2026-02-30 não passa). */
function parseIsoDate(raw: string | null): string | null {
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [y, m, d] = raw.split('-').map(Number) as [number, number, number];
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
        ? raw
        : null;
}

export function parsePatientListFilters(
    params: URLSearchParams,
): PatientListFilters {
    const dateFrom = parseIsoDate(params.get('de'));
    const dateTo = parseIsoDate(params.get('ate'));
    return {
        search: (params.get('q') ?? '').trim(),
        page: parsePositiveInt(params.get('page')) ?? 1,
        perPage: parsePerPage(params.get('per_page')),
        situation: parseSituation(params.get('situacao')),
        statuses: parseList(params.get('status')).filter(
            (s): s is PatientStatus =>
                (PATIENT_STATUSES as readonly string[]).includes(s),
        ),
        professionalIds: parseList(params.get('prof')).filter(
            (id) => parsePositiveInt(id) !== null,
        ),
        dateFrom,
        // "ate" só vale junto de um "de" que venha antes dele.
        dateTo: dateFrom && dateTo && dateTo >= dateFrom ? dateTo : null,
    };
}

export function serializePatientListFilters(
    filters: PatientListFilters,
): URLSearchParams {
    const params = new URLSearchParams();
    const search = filters.search.trim();
    if (search) params.set('q', search);
    if (filters.situation !== 'todos') {
        params.set('situacao', filters.situation);
    }
    if (filters.statuses.length > 0) {
        params.set('status', filters.statuses.join(','));
    }
    if (filters.professionalIds.length > 0) {
        params.set('prof', filters.professionalIds.join(','));
    }
    if (filters.dateFrom) {
        params.set('de', filters.dateFrom);
        if (filters.dateTo) params.set('ate', filters.dateTo);
    }
    if (filters.page > 1) params.set('page', String(filters.page));
    if (filters.perPage !== DEFAULT_PATIENT_LIST_FILTERS.perPage) {
        params.set('per_page', String(filters.perPage));
    }
    return params;
}

/** Filtros da tela → parâmetros da listagem (`GET /clinic/patients`). */
export function toPatientListParams(
    filters: PatientListFilters,
): PatientListParams {
    return {
        page: filters.page,
        perPage: filters.perPage,
        search: filters.search || undefined,
        isActive:
            filters.situation === 'todos'
                ? undefined
                : filters.situation === 'ativos',
        statuses: filters.statuses.length > 0 ? filters.statuses : undefined,
        professionalIds:
            filters.professionalIds.length > 0
                ? filters.professionalIds
                : undefined,
        dateFrom: filters.dateFrom ?? undefined,
        dateTo: filters.dateTo ?? undefined,
    };
}
