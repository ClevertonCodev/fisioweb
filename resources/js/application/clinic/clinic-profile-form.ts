import { z } from 'zod';

import type { ClinicProfile } from '@/domain/clinic/clinic-profile';
import { isValidCnpj, isValidCpf } from '@/lib/br-document-validation';

function digitsOf(value: string): string {
    return value.replace(/\D/g, '');
}

function documentError(
    typePerson: 'PF' | 'PJ',
    document: string,
): string | null {
    const trimmed = document.trim();
    const digits = digitsOf(document);

    if (typePerson === 'PF') {
        if (trimmed.length === 0) return 'CPF é obrigatório';
        if (digits.length === 0) return 'CPF deve ser numérico';
        if (digits.length !== 11) return 'CPF incompleto';
        if (!isValidCpf(document)) return 'CPF inválido';
        return null;
    }

    if (trimmed.length === 0) return 'CNPJ é obrigatório';
    if (digits.length === 0) return 'CNPJ deve ser numérico';
    if (digits.length !== 14) return 'CNPJ incompleto';
    if (!isValidCnpj(document)) return 'CNPJ inválido';
    return null;
}

export const clinicProfileFormSchema = z
    .object({
        name: z.string().trim().min(1, 'Informe o nome da clínica.'),
        typePerson: z.enum(['PF', 'PJ'], {
            required_error: 'Tipo de pessoa é obrigatório',
        }),
        document: z.string(),
        email: z
            .string()
            .trim()
            .min(1, 'E-mail é obrigatório')
            .email('E-mail inválido'),
        phone: z.string().optional().default(''),
        zipCode: z.string().optional().default(''),
        address: z.string().optional().default(''),
        number: z.string().optional().default(''),
        city: z.string().optional().default(''),
        state: z.string().optional().default(''),
    })
    .superRefine((data, ctx) => {
        const docError = documentError(data.typePerson, data.document);
        if (docError) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: docError,
                path: ['document'],
            });
        }

        const cep = digitsOf(data.zipCode ?? '');
        if (cep.length > 0 && cep.length !== 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'CEP incompleto.',
                path: ['zipCode'],
            });
        }
    });

export type ClinicProfileFormValues = z.infer<typeof clinicProfileFormSchema>;

export function clinicProfileToFormValues(
    profile: ClinicProfile,
): ClinicProfileFormValues {
    return {
        name: profile.name,
        typePerson: profile.typePerson,
        document: digitsOf(profile.document),
        email: profile.email,
        phone: profile.phone ?? '',
        zipCode: profile.zipCode ?? '',
        address: profile.address ?? '',
        number: profile.number ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
    };
}

export function clinicProfileFormToUpdateDto(
    values: ClinicProfileFormValues,
    status: ClinicProfile['status'],
) {
    return {
        name: values.name.trim(),
        typePerson: values.typePerson,
        document: digitsOf(values.document),
        email: values.email.trim(),
        phone: digitsOf(values.phone ?? '') || null,
        status,
        zipCode: digitsOf(values.zipCode ?? '') || null,
        address: values.address.trim() || null,
        number: values.number.trim() || null,
        city: values.city.trim() || null,
        state: values.state.trim() || null,
    };
}
