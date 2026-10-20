import type {
    UserListFilters,
    UserListStatus,
} from '@/application/clinic/user-list-filters';
import type { FilterChip } from '@/components/ds';

import { ROLE_META } from './roles';

export const STATUS_LABELS: Record<UserListStatus, string> = {
    todos: 'Ativos e inativos',
    ativos: 'Só ativos',
    inativos: 'Só inativos',
};

/** A busca não conta como filtro. */
export function activeUserFilterCount(filters: UserListFilters): number {
    return filters.roles.length + (filters.status !== 'todos' ? 1 : 0);
}

/** "Limpar": zera função e status; a busca fica. */
export function clearedUserListFilters(): Partial<UserListFilters> {
    return { roles: [], status: 'todos' };
}

/** Um chip por função marcada e um para o status, na ordem da barra. */
export function userListChips(filters: UserListFilters): FilterChip[] {
    const chips: FilterChip[] = filters.roles.map((role) => ({
        key: `role:${role}`,
        label: 'Função',
        value: ROLE_META[role].label,
    }));
    if (filters.status !== 'todos') {
        chips.push({
            key: 'status',
            label: 'Status',
            value: STATUS_LABELS[filters.status],
        });
    }
    return chips;
}

/** O que muda nos filtros quando o chip é removido. */
export function removeUserListChip(
    filters: UserListFilters,
    chip: FilterChip,
): Partial<UserListFilters> {
    const [kind, role] = chip.key.split(':');
    if (kind === 'role') {
        return { roles: filters.roles.filter((r) => r !== role) };
    }
    if (kind === 'status') return { status: 'todos' };
    return {};
}
