import {
    forgotPassword,
    resetPassword,
} from '@/infrastructure/api/auth.service';

/**
 * Pede o link para criar uma senha nova. A API responde igual com ou sem
 * conta, então a tela também não diz se o e-mail existe.
 */
export function requestClinicPasswordReset(email: string): Promise<void> {
    return forgotPassword('clinic', email);
}

export interface ClinicPasswordResetInput {
    token: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}

export function resetClinicPassword(
    input: ClinicPasswordResetInput,
): Promise<void> {
    return resetPassword(
        'clinic',
        input.token,
        input.email,
        input.password,
        input.passwordConfirmation,
    );
}

/** A mensagem que a API mandou, ou a de reserva. */
export function authErrorMessage(err: unknown, fallback: string): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const message = (err as { response?: { data?: { message?: unknown } } })
            .response?.data?.message;
        if (typeof message === 'string' && message.trim()) return message;
    }
    return fallback;
}

/**
 * 422 do redefinir sem erros de campo: o link venceu ou já foi usado (os 422
 * de validação trazem `errors`).
 */
export function isExpiredResetLink(err: unknown): boolean {
    if (!err || typeof err !== 'object' || !('response' in err)) return false;
    const response = (
        err as { response?: { status?: number; data?: { errors?: unknown } } }
    ).response;
    return response?.status === 422 && !response.data?.errors;
}
