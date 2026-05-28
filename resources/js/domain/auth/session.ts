/** Autenticação - contexto auth */
export type ClinicRole = 'admin' | 'secretary' | 'physiotherapist';

export interface User {
    id: string | number;
    name: string;
    email: string;
    role?: ClinicRole;
}

export interface Session {
    user: User;
    token?: string;
}

export type AuthGuard = 'admin' | 'clinic';
