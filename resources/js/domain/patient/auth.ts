/** Entidades puras da autenticação do paciente. */

export interface PatientIdentity {
    id: string;
    name: string;
    email: string;
    clinicId: string;
}

export interface ClinicOption {
    id: string;
    name: string;
    slug: string | null;
}

/**
 * A clínica chega como id (escolhida na lista) ou como slug (vinda da URL).
 * Um dos dois é obrigatório.
 */
export interface PatientLoginCredentials {
    identifier: string;
    password: string;
    clinicId?: string | null;
    clinicSlug?: string | null;
}
