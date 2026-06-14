export type ClinicProfilePersonType = 'PF' | 'PJ';

export interface ClinicProfile {
    id: string;
    name: string;
    document: string;
    typePerson: ClinicProfilePersonType;
    status: -1 | 0 | 1;
    email: string;
    phone: string | null;
    slug: string;
    zipCode: string | null;
    address: string | null;
    number: string | null;
    city: string | null;
    state: string | null;
    planId: number | null;
    planName: string | null;
}
