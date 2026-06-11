import { z } from 'zod';

import type { PatientStatus } from '@/domain/clinic/patient';

// ─── Labels e variants de status (fonte única) ───────────────────────────────

export const PATIENT_STATUS_LABELS: Record<PatientStatus, string> = {
    em_tratamento: 'Em tratamento',
    em_treinamento: 'Em treinamento',
    em_prevencao: 'Em prevenção',
    cancelado: 'Cancelado',
    obito: 'Óbito',
    alta: 'Alta',
};

export const PATIENT_STATUS_VARIANTS: Record<
    PatientStatus,
    'info' | 'warning' | 'success' | 'neutral' | 'danger'
> = {
    em_tratamento: 'info',
    em_treinamento: 'success',
    em_prevencao: 'warning',
    cancelado: 'neutral',
    obito: 'danger',
    alta: 'success',
};

export const PATIENT_STATUS_OPTIONS: { value: PatientStatus; label: string }[] = (
    Object.keys(PATIENT_STATUS_LABELS) as PatientStatus[]
).map((value) => ({ value, label: PATIENT_STATUS_LABELS[value] }));

function isValidCpf(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
    let rem = 11 - (sum % 11);
    if (rem >= 10) rem = 0;
    if (rem !== Number(digits[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
    rem = 11 - (sum % 11);
    if (rem >= 10) rem = 0;
    return rem === Number(digits[10]);
}

import type { PatientDetail } from '@/domain/clinic/patient';

import type { PatientUpdateDto, PatientWriteDto } from './ports';

// ─── Schema de validação do formulário ───────────────────────────────────────

export const patientFormSchema = z
    .object({
        name: z.string().min(1, 'Nome obrigatório'),
        is_foreign: z.boolean(),
        cpf: z.string(),
        apelido: z.string(),
        use_apelido: z.boolean(),
        birth_date: z.string().min(1, 'Data de nascimento obrigatória'),
        marital_status: z.string(),
        profession: z.string(),
        biological_sex: z.string(),
        gender: z.string(),
        education: z.string(),
        status: z.enum([
            'em_tratamento',
            'em_treinamento',
            'em_prevencao',
            'cancelado',
            'obito',
            'alta',
        ]),
        diagnosis: z.string().max(500, 'Máximo de 500 caracteres'),
        phone: z.string().min(1, 'Telefone obrigatório'),
        email: z.string().min(1, 'E-mail obrigatório'),
        zip_code: z.string(),
        address_street: z.string(),
        address_number: z.string(),
        address_no_number: z.boolean(),
        address_complement: z.string(),
        neighborhood: z.string(),
        city: z.string(),
        state: z.string(),
        has_insurance: z.boolean(),
        insurance: z.string(),
        insurance_number: z.string(),
        referral_source: z.string(),
    })
    .superRefine((data, ctx) => {
        if (!data.cpf || data.cpf.trim().length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: data.is_foreign ? 'Documento obrigatório' : 'CPF obrigatório',
                path: ['cpf'],
            });
        } else if (!data.is_foreign && !isValidCpf(data.cpf)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'CPF inválido',
                path: ['cpf'],
            });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'E-mail inválido',
                path: ['email'],
            });
        }
    });

export type PatientFormValues = z.infer<typeof patientFormSchema>;

// ─── Valores padrão ───────────────────────────────────────────────────────────

export const patientFormDefaults: PatientFormValues = {
    name: '',
    is_foreign: false,
    cpf: '',
    apelido: '',
    use_apelido: false,
    birth_date: '',
    marital_status: '',
    profession: '',
    biological_sex: '',
    gender: '',
    education: '',
    status: 'em_tratamento',
    diagnosis: '',
    phone: '',
    email: '',
    zip_code: '',
    address_street: '',
    address_number: '',
    address_no_number: false,
    address_complement: '',
    neighborhood: '',
    city: '',
    state: '',
    has_insurance: false,
    insurance: '',
    insurance_number: '',
    referral_source: '',
};

// ─── Campos obrigatórios por aba (para indicadores de erro) ───────────────────

export const patientFormTabFields: Record<string, (keyof PatientFormValues)[]> = {
    'dados-pessoais': ['name', 'cpf', 'birth_date'],
    contato: ['phone', 'email'],
};

// ─── Mapper: PatientFormValues → PatientWriteDto ─────────────────────────────

/** Preenche o formulário a partir de um PatientDetail carregado da API */
export function toPatientFormValues(detail: PatientDetail): PatientFormValues {
    const address = detail.address ?? '';
    // address é salvo como "rua, número, complemento" — separamos na vírgula
    const parts = address.split(',').map((s) => s.trim());

    return {
        name: detail.name,
        is_foreign: detail.isForeign,
        cpf: detail.cpf ?? '',
        apelido: detail.apelido ?? '',
        use_apelido: detail.useApelido,
        birth_date: detail.birthDate ? detail.birthDate.slice(0, 10) : '',
        marital_status: detail.maritalStatus ?? '',
        profession: detail.profession ?? '',
        biological_sex: detail.biologicalSex ?? '',
        gender: detail.gender ?? '',
        education: detail.education ?? '',
        status: (detail.status as PatientFormValues['status']) ?? 'em_tratamento',
        diagnosis: detail.diagnosis ?? '',
        phone: detail.phone ?? '',
        email: detail.email ?? '',
        zip_code: detail.zipCode ?? '',
        address_street: parts[0] ?? '',
        address_number: (parts[1] ?? '').toUpperCase() === 'S/N' ? '' : (parts[1] ?? ''),
        address_no_number: (parts[1] ?? '').toUpperCase() === 'S/N',
        address_complement: parts[2] ?? '',
        neighborhood: detail.neighborhood ?? '',
        city: detail.city ?? '',
        state: detail.state ?? '',
        has_insurance: !!detail.insurance,
        insurance: detail.insurance ?? '',
        insurance_number: detail.insuranceNumber ?? '',
        referral_source: detail.referralSource ?? '',
    };
}

/** DTO de atualização (sem senha) a partir dos valores do formulário */
export function toPatientUpdateDto(data: PatientFormValues): PatientUpdateDto {
    const addressParts = [
        data.address_street,
        data.address_no_number ? 'S/N' : data.address_number,
        data.address_complement,
    ].filter(Boolean);

    return {
        name: data.name,
        phone: data.phone,
        birthDate: data.birth_date,
        email: data.email,
        isForeign: data.is_foreign,
        cpf: data.cpf || undefined,
        apelido: data.apelido || undefined,
        useApelido: data.use_apelido,
        maritalStatus: data.marital_status || undefined,
        profession: data.profession || undefined,
        biologicalSex: data.biological_sex || undefined,
        gender: data.gender || undefined,
        education: data.education || undefined,
        status: data.status,
        diagnosis: data.diagnosis || undefined,
        address: addressParts.length ? addressParts.join(', ') : undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipCode: data.zip_code || undefined,
        insurance: data.has_insurance ? data.insurance || undefined : undefined,
        insuranceNumber: data.has_insurance ? data.insurance_number || undefined : undefined,
        referralSource: data.referral_source || undefined,
    };
}

export function toPatientWriteDto(data: PatientFormValues): PatientWriteDto {
    const addressParts = [
        data.address_street,
        data.address_no_number ? 'S/N' : data.address_number,
        data.address_complement,
    ].filter(Boolean);

    return {
        name: data.name,
        phone: data.phone,
        birthDate: data.birth_date,
        email: data.email,
        password: data.cpf.replace(/\D/g, ''),
        isForeign: data.is_foreign,
        cpf: data.cpf || undefined,
        apelido: data.apelido || undefined,
        useApelido: data.use_apelido,
        maritalStatus: data.marital_status || undefined,
        profession: data.profession || undefined,
        biologicalSex: data.biological_sex || undefined,
        gender: data.gender || undefined,
        education: data.education || undefined,
        status: data.status,
        diagnosis: data.diagnosis || undefined,
        address: addressParts.length ? addressParts.join(', ') : undefined,
        neighborhood: data.neighborhood || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipCode: data.zip_code || undefined,
        insurance: data.has_insurance ? data.insurance || undefined : undefined,
        insuranceNumber: data.has_insurance ? data.insurance_number || undefined : undefined,
        referralSource: data.referral_source || undefined,
    };
}
