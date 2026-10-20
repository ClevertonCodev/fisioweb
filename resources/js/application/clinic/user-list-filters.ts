import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

/**
 * Estado da lista de usuários guardado na URL (mesmo padrão do ADR 015).
 * Ler e escrever são funções puras: valor inválido na URL cai no padrão, e
 * valor padrão não vai para a URL.
 *
 * ?q=maria&funcao=admin,physiotherapist&status=ativos|inativos
 */

/** "todos" = ativos e inativos. */
export type UserListStatus = 'todos' | 'ativos' | 'inativos';

export const CLINIC_ROLES: readonly ClinicRole[] = [
    'admin',
    'physiotherapist',
    'secretary',
];

export interface UserListFilters {
    search: string;
    roles: ClinicRole[];
    status: UserListStatus;
}

export const DEFAULT_USER_LIST_FILTERS: UserListFilters = {
    search: '',
    roles: [],
    status: 'todos',
};

function parseStatus(raw: string | null): UserListStatus {
    return raw === 'ativos' || raw === 'inativos' ? raw : 'todos';
}

function parseRoles(raw: string | null): ClinicRole[] {
    return [...new Set((raw ?? '').split(','))].filter((r): r is ClinicRole =>
        (CLINIC_ROLES as readonly string[]).includes(r),
    );
}

export function parseUserListFilters(params: URLSearchParams): UserListFilters {
    return {
        search: (params.get('q') ?? '').trim(),
        roles: parseRoles(params.get('funcao')),
        status: parseStatus(params.get('status')),
    };
}

export function serializeUserListFilters(
    filters: UserListFilters,
): URLSearchParams {
    const params = new URLSearchParams();
    const search = filters.search.trim();
    if (search) params.set('q', search);
    if (filters.roles.length > 0) params.set('funcao', filters.roles.join(','));
    if (filters.status !== 'todos') params.set('status', filters.status);
    return params;
}

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

/** A equipe inteira vem da API; o recorte é feito aqui. */
export function applyUserListFilters<T extends ClinicUserSummary>(
    users: T[],
    filters: UserListFilters,
): T[] {
    const query = normalize(filters.search.trim());
    return users.filter(
        (u) =>
            (filters.roles.length === 0 || filters.roles.includes(u.role)) &&
            (filters.status === 'todos' ||
                Boolean(u.status) === (filters.status === 'ativos')) &&
            (!query || normalize(`${u.name} ${u.email}`).includes(query)),
    );
}

/** Mestre primeiro, depois por nome. */
export function sortTeam<T extends ClinicUserSummary>(users: T[]): T[] {
    return [...users].sort(
        (a, b) => b.mestre - a.mestre || a.name.localeCompare(b.name, 'pt-BR'),
    );
}
