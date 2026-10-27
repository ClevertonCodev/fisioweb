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

export interface PatientLoginCredentials {
    identifier: string;
    password: string;
    clinicId?: string | null;
    clinicSlug?: string | null;
}
