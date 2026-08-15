import { patientProgramsListPath } from './patient-program-paths';

export function patientLoginPath(clinicSlug?: string | null): string {
    return clinicSlug ? `/${clinicSlug}/paciente/login` : '/paciente/login';
}

export function patientLoginPathWithNext(
    clinicSlug: string | null | undefined,
    next: string,
): string {
    const base = patientLoginPath(clinicSlug);
    return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

export function safePatientNext(
    next: string | null | undefined,
): string | null {
    if (!next) return null;

    if (next.startsWith('//')) return null;
    if (!next.startsWith('/')) return null;
    if (/^\/\\/.test(next)) return null;

    const isGenericPatientLogin =
        next === '/paciente/login' || next.startsWith('/paciente/login?');

    const isClinicScopedPatient =
        /^\/[^/]+\/paciente(\/|$)/.test(next);

    return isGenericPatientLogin || isClinicScopedPatient ? next : null;
}

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
