import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

/**
 * Travas da lista de usuários, espelhando o ClinicUserService: o mestre e o
 * último administrador ativo não perdem o papel admin, não são desativados e
 * não são excluídos. É só UX: quem protege é a API, que devolve 422.
 */
export interface ClinicUserLocks {
    /** Motivo para não mudar a função; `null` quando pode. */
    roleChange: string | null;
    /** Motivo para não desativar; `null` quando pode (ou já está inativo). */
    deactivate: string | null;
    canDelete: boolean;
}

const MASTER_REASON =
    'O mestre é o dono da conta e continua administrador e ativo.';
const LAST_ADMIN_REASON =
    'A clínica precisa de pelo menos um administrador ativo.';

function isActiveAdmin(user: ClinicUserSummary): boolean {
    return user.role === 'admin' && Boolean(user.status);
}

/** `team` é a equipe inteira, não o recorte filtrado da tela. */
export function isLastActiveAdmin(
    user: ClinicUserSummary,
    team: ClinicUserSummary[],
): boolean {
    return isActiveAdmin(user) && team.filter(isActiveAdmin).length <= 1;
}

export function clinicUserLocks(
    user: ClinicUserSummary,
    team: ClinicUserSummary[],
): ClinicUserLocks {
    const reason =
        user.mestre === 1
            ? MASTER_REASON
            : isLastActiveAdmin(user, team)
              ? LAST_ADMIN_REASON
              : null;
    return {
        roleChange: reason,
        deactivate: user.status ? reason : null,
        canDelete: reason === null,
    };
}
