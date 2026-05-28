/** Clínica - contexto admin (entidade pura, camelCase, sem concerns de infra) */
export type PersonType = 'PF' | 'PJ';

export interface Clinic {
    id: number;
    name: string;
    document: string;
    typePerson: PersonType;
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
    createdAt: string;
}
