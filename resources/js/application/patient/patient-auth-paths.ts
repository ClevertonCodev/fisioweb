/** Paths canônicos do login do paciente. */

import { patientProgramsListPath } from './patient-program-paths';

/** Login com a clínica fixada pelo contexto da URL. */
export function patientLoginPath(clinicSlug?: string | null): string {
    return clinicSlug ? `/${clinicSlug}/paciente/login` : '/paciente/login';
}

/** Monta o login já carregando o destino de retorno. */
export function patientLoginPathWithNext(
    clinicSlug: string | null | undefined,
    next: string,
): string {
    const base = patientLoginPath(clinicSlug);
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

/**
 * Valida o destino de retorno recebido em `?next=`.
 *
 * Aceitar o valor cru é open redirect: `?next=https://site-falso` levaria o
 * paciente autenticado para fora. Checar apenas "começa com /" não basta —
 * o navegador resolve `//host` como URL absoluta com o protocolo atual.
 *
 * Retorna o destino seguro, ou `null` se o valor não for confiável.
 */
export function safePatientNext(
    next: string | null | undefined,
): string | null {
    if (!next) return null;

    // Protocolo relativo (`//host`) e URL absoluta são sempre externos.
    if (next.startsWith('//')) return null;
    if (!next.startsWith('/')) return null;
    if (/^\/\\/.test(next)) return null;

    // Só caminhos da área do paciente com rota SPA real.
    // `/paciente/login` existe; `/paciente/programas` não — exigiria slug.
    const isGenericPatientLogin =
        next === '/paciente/login' || next.startsWith('/paciente/login?');

    const isClinicScopedPatient =
        /^\/[^/]+\/paciente(\/|$)/.test(next);

    return isGenericPatientLogin || isClinicScopedPatient ? next : null;
}

/** Destino após o login: o `next` validado, ou a lista de programas. */
export function patientPostLoginPath(
    next: string | null | undefined,
    clinicSlug: string,
): string {
    const safe = safePatientNext(next);
    if (safe) return safe;

    if (clinicSlug) {
        return patientProgramsListPath(clinicSlug);
    }

    return '/paciente/login';
}
