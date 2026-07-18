import { z } from 'zod';

import { isValidCnpj, isValidCpf } from '@/lib/br-document-validation';

export const clinicRegisterSchema = z
    .object({
        name: z.string().trim().min(1, 'Nome da clínica é obrigatório'),
        typePerson: z.enum(['PF', 'PJ'], {
            required_error: 'Selecione o tipo de pessoa',
        }),
        document: z.string().min(1, 'Documento é obrigatório'),
        email: z
            .string()
            .trim()
            .min(1, 'E-mail é obrigatório')
            .email('E-mail inválido'),
        phone: z.string().optional().default(''),
        slug: z.string().trim().min(1, 'URL da clínica é obrigatória'),
        password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
        passwordConfirmation: z.string().min(1, 'Confirme a senha'),
    })
    .superRefine((data, ctx) => {
        // CPF / CNPJ com dígitos verificadores
        if (data.typePerson === 'PJ') {
            if (!isValidCnpj(data.document)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'CNPJ inválido',
                    path: ['document'],
                });
            }
        } else if (data.typePerson === 'PF') {
            if (!isValidCpf(data.document)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'CPF inválido',
                    path: ['document'],
                });
            }
        }

        // Telefone opcional, mas se preenchido precisa ter 10 ou 11 dígitos
        const phoneDigits = (data.phone ?? '').replace(/\D/g, '');
        if (phoneDigits.length > 0 && phoneDigits.length < 10) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Telefone incompleto',
                path: ['phone'],
            });
        }

        // Confirmação de senha
        if (data.password !== data.passwordConfirmation) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'As senhas não coincidem',
                path: ['passwordConfirmation'],
            });
        }
    });

export type ClinicRegisterValues = z.infer<typeof clinicRegisterSchema>;
