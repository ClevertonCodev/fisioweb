import { z } from 'zod';

import type { ClinicProfile } from '@/domain/clinic/clinic-profile';

export const clinicProfileFormSchema = z
    .object({
        name: z.string().min(1, 'Nome é obrigatório'),
        typePerson: z.enum(['PF', 'PJ'], {
            required_error: 'Tipo de pessoa é obrigatório',
        }),
        document: z.string().min(1, 'Documento é obrigatório'),
        email: z
            .string()
            .min(1, 'E-mail é obrigatório')
            .email('E-mail inválido'),
        phone: z.string().optional().default(''),
        status: z.string().default('1'),
        slug: z.string().min(1, 'Slug é obrigatório'),
        planId: z.string().optional().default(''),
        zipCode: z.string().optional().default(''),
        address: z.string().optional().default(''),
        number: z.string().optional().default(''),
        city: z.string().optional().default(''),
        state: z.string().optional().default(''),
    })
    .superRefine((data, ctx) => {
        const requiredLen = data.typePerson === 'PJ' ? 14 : 11;
        const label = data.typePerson === 'PJ' ? 'CNPJ' : 'CPF';
        if (data.document.length === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Documento é obrigatório',
                path: ['document'],
            });
        } else if (data.document.length < requiredLen) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `${label} incompleto`,
                path: ['document'],
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
        document: profile.document.replace(/\D/g, ''),
        email: profile.email,
        phone: profile.phone ?? '',
        status: String(profile.status),
        slug: profile.slug ?? '',
        planId: profile.planId != null ? String(profile.planId) : '',
        zipCode: profile.zipCode ?? '',
        address: profile.address ?? '',
        number: profile.number ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
    };
}

export function clinicProfileFormToUpdateDto(values: ClinicProfileFormValues) {
    return {
        name: values.name,
        typePerson: values.typePerson,
        document: values.document,
        email: values.email,
        phone: values.phone || null,
        status: parseInt(values.status, 10),
        zipCode: values.zipCode || null,
        address: values.address || null,
        number: values.number || null,
        city: values.city || null,
        state: values.state || null,
    };
}
