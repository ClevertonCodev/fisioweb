import { z } from 'zod';

import { isValidCnpj, isValidCpf } from '@/lib/br-document-validation';

export const CLINIC_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const clinicRegisterSchema = z
    .object({
        name: z.string(),
        typePerson: z.enum(['PF', 'PJ'], {
            required_error: 'Selecione o tipo de pessoa',
        }),
        document: z.string(),
        email: z.string(),
        phone: z.string().optional().default(''),
        slug: z.string(),
        password: z.string(),
        passwordConfirmation: z.string(),
        termsAccepted: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
        if (!data.name.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Nome da clínica é obrigatório',
                path: ['name'],
            });
        }

        if (!data.document.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Documento é obrigatório',
                path: ['document'],
            });
        } else if (data.typePerson === 'PJ' && !isValidCnpj(data.document)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'CNPJ inválido',
                path: ['document'],
            });
        } else if (data.typePerson === 'PF' && !isValidCpf(data.document)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'CPF inválido',
                path: ['document'],
            });
        }

        const trimmedEmail = data.email.trim();
        if (!trimmedEmail) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'E-mail é obrigatório',
                path: ['email'],
            });
        } else if (!EMAIL_REGEX.test(trimmedEmail)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'E-mail inválido',
                path: ['email'],
            });
        }

        const phoneDigits = (data.phone ?? '').replace(/\D/g, '');
        if (phoneDigits.length > 0 && phoneDigits.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Telefone incompleto',
                path: ['phone'],
            });
        }

        const trimmedSlug = data.slug.trim();
        if (!trimmedSlug) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'URL da clínica é obrigatória',
                path: ['slug'],
            });
        } else if (!CLINIC_SLUG_REGEX.test(trimmedSlug)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Use apenas letras minúsculas, números e hífens',
                path: ['slug'],
            });
        }

        if (data.password.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'A senha deve ter ao menos 8 caracteres',
                path: ['password'],
            });
        }

        if (!data.passwordConfirmation) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Confirme a senha',
                path: ['passwordConfirmation'],
            });
        } else if (data.password !== data.passwordConfirmation) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'As senhas não coincidem',
                path: ['passwordConfirmation'],
            });
        }

        if (data.termsAccepted !== true) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    'Aceite os Termos de Uso e a Política de Privacidade para criar a conta',
                path: ['termsAccepted'],
            });
        }
    });

export type ClinicRegisterValues = z.infer<typeof clinicRegisterSchema>;
export type ClinicRegisterField = keyof ClinicRegisterValues;
