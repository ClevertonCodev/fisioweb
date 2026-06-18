import { z } from 'zod';

export const clinicFormSchema = z
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

export type ClinicFormValues = z.infer<typeof clinicFormSchema>;

export const editClinicFormSchema = z
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

export type EditClinicFormValues = z.infer<typeof editClinicFormSchema>;
