import {
    DEFAULT_PATIENT_LIST_FILTERS,
    type PatientListFilters,
    type PatientSituation,
} from '@/application/clinic/patient-list-filters';
import type { FilterChip } from '@/components/ds';
import type { PatientStatus } from '@/domain/clinic/patient';

import { statusLabel } from './patient-status';

export const SITUATION_LABELS: Record<PatientSituation, string> = {
    todos: 'Ativos e inativos',
    ativos: 'Só ativos',
    inativos: 'Só inativos',
};

/** Títulos que não contam como nome ("Dra. Ana Paula" → "Ana"). */
const HONORIFICS = new Set(['dr', 'dra', 'prof', 'profa', 'sr', 'sra']);

export function firstName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    const name = parts.find(
        (p) => !HONORIFICS.has(p.replace(/\.$/, '').toLowerCase()),
    );
    return name ?? parts[0] ?? fullName;
}

/** "2026-01-05" → "05/01/2026", sem passar por Date (sem fuso). */
function formatIsoDay(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

/** Busca e itens por página não contam como filtro. */
export function activePatientFilterCount(filters: PatientListFilters): number {
    return (
        filters.statuses.length +
        filters.professionalIds.length +
        (filters.situation !== 'todos' ? 1 : 0) +
        (filters.dateFrom ? 1 : 0)
    );
}

/** "Limpar": zera os filtros e os itens por página; a busca fica. */
export function clearedPatientListFilters(): Partial<PatientListFilters> {
    const d = DEFAULT_PATIENT_LIST_FILTERS;
    return {
        perPage: d.perPage,
        situation: d.situation,
        statuses: d.statuses,
        professionalIds: d.professionalIds,
        dateFrom: d.dateFrom,
        dateTo: d.dateTo,
    };
}

/**
 * Um chip por filtro aplicado, na ordem da barra. Vários profissionais cabem
 * num chip só, com o primeiro nome de cada um.
 */
export function patientListChips(
    filters: PatientListFilters,
    professionals: { id: string; name: string }[],
): FilterChip[] {
    const chips: FilterChip[] = [];
    if (filters.dateFrom) {
        chips.push({
            key: 'range',
            label: 'Cadastro',
            value: filters.dateTo
                ? `${formatIsoDay(filters.dateFrom)} – ${formatIsoDay(filters.dateTo)}`
                : `a partir de ${formatIsoDay(filters.dateFrom)}`,
        });
    }
    if (filters.situation !== 'todos') {
        chips.push({
            key: 'situation',
            label: 'Situação',
            value: SITUATION_LABELS[filters.situation],
        });
    }
    for (const status of filters.statuses) {
        chips.push({
            key: `status:${status}`,
            label: 'Status',
            value: statusLabel(status),
        });
    }
    if (filters.professionalIds.length > 0) {
        chips.push({
            key: 'prof',
            label:
                filters.professionalIds.length === 1
                    ? 'Profissional'
                    : 'Profissionais',
            value: filters.professionalIds
                .map((id) => {
                    const name = professionals.find((p) => p.id === id)?.name;
                    return name ? firstName(name) : `#${id}`;
                })
                .join(', '),
        });
    }
    if (filters.perPage !== DEFAULT_PATIENT_LIST_FILTERS.perPage) {
        chips.push({
            key: 'perPage',
            label: 'Itens por página',
            value: String(filters.perPage),
        });
    }
    return chips;
}

/** O que muda nos filtros quando o chip é removido. */
export function removePatientListChip(
    filters: PatientListFilters,
    chip: FilterChip,
): Partial<PatientListFilters> {
    const [kind, id] = chip.key.split(':');
    switch (kind) {
        case 'range':
            return { dateFrom: null, dateTo: null };
        case 'situation':
            return { situation: 'todos' };
        case 'status':
            return {
                statuses: filters.statuses.filter(
                    (s): s is PatientStatus => s !== id,
                ),
            };
        case 'prof':
            return { professionalIds: [] };
        case 'perPage':
            return { perPage: DEFAULT_PATIENT_LIST_FILTERS.perPage };
        default:
            return {};
    }
}
