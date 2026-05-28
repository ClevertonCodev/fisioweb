/** Paciente - contexto clínica */
export type PatientStatus =
    | 'em_tratamento'
    | 'em_treinamento'
    | 'em_prevencao'
    | 'cancelado'
    | 'obito'
    | 'alta';

export interface Patient {
    id: string;
    name: string;
    initial: string;
    professional: string;
    professionalInitial: string;
    status: PatientStatus;
    diagnosis: string;
    photoUrl?: string;
}

/** Detalhe completo do paciente — usado no formulário de edição */
export interface PatientDetail extends Patient {
    cpf?: string;
    isForeign: boolean;
    apelido?: string;
    useApelido: boolean;
    birthDate?: string;
    maritalStatus?: string;
    profession?: string;
    biologicalSex?: string;
    gender?: string;
    education?: string;
    phone?: string;
    email?: string;
    zipCode?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    insurance?: string;
    insuranceNumber?: string;
    referralSource?: string;
}
