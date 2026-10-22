import type { Program } from '@/domain/clinic';

const DAY = 86_400_000;

export type UiStatus = 'not_viewed' | 'viewed' | 'completed' | 'draft';

export type ValidityKey = 'active' | 'ending' | 'ended' | 'open';

export interface HistoryFilters {
    search: string;
    statuses: UiStatus[];
    professionalIds: string[];
    validity: ValidityKey | 'all';
    createdFrom: string | null;
    createdTo: string | null;
    page: number;
    perPage: number;
}

export const INITIAL_FILTERS: HistoryFilters = {
    search: '',
    statuses: [],
    professionalIds: [],
    validity: 'all',
    createdFrom: null,
    createdTo: null,
    page: 1,
    perPage: 16,
};

export const PER_PAGE_OPTIONS = [16, 32, 50];

export const STATUS_OPTIONS: { value: UiStatus; label: string }[] = [
    { value: 'not_viewed', label: 'Não visualizado' },
    { value: 'viewed', label: 'Visualizado' },
    { value: 'completed', label: 'Completou' },
    { value: 'draft', label: 'Rascunho' },
];

export const VALIDITY_LABELS: Record<ValidityKey, string> = {
    active: 'Vigente',
    ending: 'Termina em até 7 dias',
    ended: 'Encerrado',
    open: 'Sem data de término',
};

export function parseDate(value: string | null): Date | null {
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number) as [
            number,
            number,
            number,
        ];
        return new Date(y, m - 1, d);
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function formatShort(value: string | null): string {
    const date = parseDate(value);
    if (!date) return '—';
    return date
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        .replace('.', '');
}

export function formatLong(value: string | null): string {
    const date = parseDate(value);
    if (!date) return '—';
    return date
        .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
        .replace('.', '');
}

export function uiStatusOf(program: Program): UiStatus {
    if (program.status === 'draft') return 'draft';
    // Completou = paciente concluiu (contador) ou plano marcado completed
    if (
        program.patientCompletedCount > 0 ||
        program.status === 'completed'
    ) {
        return 'completed';
    }
    if (program.patientViewedAt) return 'viewed';
    return 'not_viewed';
}

export interface Validity {
    key: ValidityKey;
    totalDays: number | null;
    daysLeft: number | null;
    progress: number;
    text: string;
}

export function validityOf(program: Program): Validity {
    const start = parseDate(program.startDate);
    const end = parseDate(program.endDate);
    const today = startOfToday();
    if (!end) {
        return {
            key: 'open',
            totalDays: null,
            daysLeft: null,
            progress: 0,
            text: 'Sem data de término',
        };
    }
    const daysLeft = Math.round((end.getTime() - today.getTime()) / DAY);
    const totalDays = start
        ? Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY))
        : null;
    const elapsed = start ? (today.getTime() - start.getTime()) / DAY : 0;
    const progress =
        totalDays && totalDays > 0
            ? Math.min(
                  100,
                  Math.max(0, Math.round((elapsed / totalDays) * 100)),
              )
            : daysLeft < 0
              ? 100
              : 0;

    if (daysLeft < 0) {
        const ago = Math.abs(daysLeft);
        return {
            key: 'ended',
            totalDays,
            daysLeft,
            progress: 100,
            text: `Encerrou há ${ago} ${ago === 1 ? 'dia' : 'dias'}`,
        };
    }
    if (daysLeft <= 7) {
        return {
            key: 'ending',
            totalDays,
            daysLeft,
            progress,
            text:
                daysLeft === 0
                    ? 'Termina hoje'
                    : `Termina em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
        };
    }
    return {
        key: 'active',
        totalDays,
        daysLeft,
        progress,
        text: `Faltam ${daysLeft} dias`,
    };
}

export function activeFilterCount(f: HistoryFilters): number {
    return (
        (f.search.trim() ? 1 : 0) +
        f.statuses.length +
        f.professionalIds.length +
        (f.validity !== 'all' ? 1 : 0) +
        (f.createdFrom ? 1 : 0)
    );
}

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

export function applyFilters(
    programs: Program[],
    f: HistoryFilters,
    patientId: string | null,
): Program[] {
    const q = normalize(f.search.trim());
    const from = parseDate(f.createdFrom);
    const to = parseDate(f.createdTo);
    return programs.filter((p) => {
        if (patientId && p.patientId !== patientId) return false;
        if (
            q &&
            !normalize(
                `${p.title} ${p.patientName ?? ''} ${p.professionalName ?? ''}`,
            ).includes(q)
        ) {
            return false;
        }
        if (f.statuses.length && !f.statuses.includes(uiStatusOf(p))) {
            return false;
        }
        if (
            f.professionalIds.length &&
            (!p.professionalId || !f.professionalIds.includes(p.professionalId))
        ) {
            return false;
        }
        if (f.validity !== 'all' && validityOf(p).key !== f.validity) {
            return false;
        }
        const created = parseDate(p.createdAt);
        if (from && created && created < from) return false;
        if (to && created && created.getTime() >= to.getTime() + DAY) {
            return false;
        }
        return true;
    });
}

export interface HistoryChip {
    key: string;
    label: string;
    value: string;
}

export function historyChips(
    f: HistoryFilters,
    professionals: { id: string; name: string }[],
    patientName: string | null,
): HistoryChip[] {
    const chips: HistoryChip[] = [];
    if (f.search.trim()) {
        chips.push({
            key: 'search',
            label: 'Busca',
            value: f.search.trim(),
        });
    }
    if (patientName) {
        chips.push({ key: 'patient', label: 'Paciente', value: patientName });
    }
    for (const s of f.statuses) {
        chips.push({
            key: `status:${s}`,
            label: 'Status',
            value: STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s,
        });
    }
    for (const id of f.professionalIds) {
        chips.push({
            key: `prof:${id}`,
            label: 'Profissional',
            value: professionals.find((p) => p.id === id)?.name ?? id,
        });
    }
    if (f.validity !== 'all') {
        chips.push({
            key: 'validity',
            label: 'Validade',
            value: VALIDITY_LABELS[f.validity],
        });
    }
    if (f.createdFrom) {
        chips.push({
            key: 'created',
            label: 'Criado',
            value: `${formatLong(f.createdFrom)} a ${formatLong(f.createdTo ?? f.createdFrom)}`,
        });
    }
    return chips;
}

export function removeChip(
    f: HistoryFilters,
    chip: Pick<HistoryChip, 'key'>,
): Partial<HistoryFilters> {
    const [kind, value] = chip.key.split(':') as [string, string | undefined];
    if (kind === 'search') {
        return { search: '' };
    }
    if (kind === 'status') {
        return { statuses: f.statuses.filter((s) => s !== value) };
    }
    if (kind === 'prof') {
        return {
            professionalIds: f.professionalIds.filter((id) => id !== value),
        };
    }
    if (kind === 'validity') return { validity: 'all' };
    if (kind === 'created') return { createdFrom: null, createdTo: null };
    return {};
}

export function exerciseCountLabel(n: number): string {
    return `${n} ${n === 1 ? 'exercício' : 'exercícios'}`;
}

export function programPath(program: Program): string {
    return `/clinica/programas/${program.id}`;
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
}
