/** Paths canônicos da área paciente (sempre com clinicSlug). */

export function patientProgramsListPath(clinicSlug: string): string {
    if (!clinicSlug) {
        throw new Error('patientProgramsListPath requires a clinic slug');
    }

    return `/${clinicSlug}/paciente/programas`;
}

export function patientProgramDetailPath(
    clinicSlug: string,
    publicToken: string,
): string {
    return `/${clinicSlug}/paciente/programas/${publicToken}`;
}

export function patientExerciseDetailPath(
    clinicSlug: string,
    publicToken: string,
    exerciseId: string,
): string {
    return `/${clinicSlug}/paciente/programas/${publicToken}/exercicios/${exerciseId}`;
}

export function patientProgramExecutePath(
    clinicSlug: string,
    publicToken: string,
    startAt?: string,
): string {
    const base = `/${clinicSlug}/paciente/programas/${publicToken}/executar`;
    return startAt ? `${base}?startAt=${encodeURIComponent(startAt)}` : base;
}

export function patientProgramFeedbackPath(
    clinicSlug: string,
    publicToken: string,
): string {
    return `/${clinicSlug}/paciente/programas/${publicToken}/executar/feedback`;
}

export function patientProgramSuccessPath(
    clinicSlug: string,
    publicToken: string,
): string {
    return `/${clinicSlug}/paciente/programas/${publicToken}/executar/concluido`;
}

export function isPatientProgramsListPath(path: string): boolean {
    return /^\/[^/]+\/paciente\/programas\/?$/.test(path);
}

/** Detalhe, execução, feedback etc. — qualquer rota abaixo da lista. */
export function isPatientProgramSubPath(path: string): boolean {
    return /^\/[^/]+\/paciente\/programas\/.+/.test(path);
}
