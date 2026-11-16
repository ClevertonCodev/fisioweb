import type { ClinicRole } from '@/domain/auth/session';

export const MASTER_CREDENTIALS_REASON =
    'Só o mestre altera o e-mail e a senha dele.';

export const IMPERSONATION_CREDENTIALS_REASON =
    'No "entrar como", o e-mail e a senha do mestre não mudam. Para devolver o acesso, use o link de nova senha.';

export const can = {
    /** E-mail e senha do mestre: só ele troca, e o "entrar como" não conta como ele (ADR 019). */
    changeCredentials: (
        targetMestre?: 0 | 1,
        isSelf?: boolean,
        impersonating = false,
    ) => targetMestre !== 1 || (isSelf === true && !impersonating),
    delete: (role?: ClinicRole) => role === 'admin',
    deleteOwn: (role?: ClinicRole) =>
        role === 'admin' || role === 'physiotherapist',
    manageUsers: (role?: ClinicRole) => role === 'admin',
    manageClinicData: (role?: ClinicRole) => role === 'admin',
    editClinicData: (mestre?: 0 | 1) => mestre === 1,
    sign: (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
    bulkInactivate: (role?: ClinicRole) =>
        role === 'admin' || role === 'secretary',
    reactivate: (role?: ClinicRole) => role === 'admin' || role === 'secretary',
    manageClinicalRecords: (role?: ClinicRole) =>
        role === 'admin' || role === 'physiotherapist',
    manageEvolutionTemplates: (role?: ClinicRole) =>
        role === 'admin' || role === 'physiotherapist',
    manageServiceTypes: (role?: ClinicRole) =>
        role === 'admin' || role === 'secretary',
    /** Finanças: lançar, editar, excluir, lixeira, resumo, relatório e exportar. */
    manageFinances: (role?: ClinicRole) =>
        role === 'admin' || role === 'secretary',
    /** Configurações de Finanças: categorias e saldo inicial. */
    manageFinanceSettings: (role?: ClinicRole) => role === 'admin',
    /** Capa e fotos do PDF do exercício que a própria clínica enviou. */
    changeExerciseImages: (role?: ClinicRole, isOwnSubmission?: boolean) =>
        role === 'admin' && isOwnSubmission === true,
};
