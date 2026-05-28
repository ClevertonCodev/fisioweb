import { z } from 'zod';

import type { ClinicUserWriteDto } from '@/application/clinic/ports';
import {
    type ClinicUserDocumentKind,
    isValidCnpj,
    isValidCpf,
    isValidCrefitoRegistration,
    serializeClinicUserDocument,
} from '@/lib/br-document-validation';

export const CLINIC_USER_ROLES = ['admin', 'secretary', 'physiotherapist'] as const;

export type ClinicUserFormRole = (typeof CLINIC_USER_ROLES)[number];

export function normalizeClinicUserRole(role: unknown): ClinicUserFormRole | null {
    if (typeof role === 'string' && (CLINIC_USER_ROLES as readonly string[]).includes(role)) {
        return role as ClinicUserFormRole;
    }
    return null;
}

const roleEnum = z.enum(CLINIC_USER_ROLES, { required_error: 'Função obrigatória' });

export const CLINIC_USER_DOCUMENT_KINDS = ['cpf', 'cnpj', 'crefito'] as const;

const documentKindEnum = z.enum(CLINIC_USER_DOCUMENT_KINDS);

function addClinicUserDocumentIssues(
    data: {
        documentKind?: ClinicUserDocumentKind;
        document?: string;
    },
    ctx: z.RefinementCtx,
): void {
    const kind = data.documentKind;
    if (kind == null) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Tipo de documento obrigatório.',
            path: ['documentKind'],
        });
        return;
    }

    const doc = data.document ?? '';
    const t = doc.trim();
    if (t === '') {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Documento obrigatório.',
            path: ['document'],
        });
        return;
    }
    switch (kind) {
        case 'cpf': {
            const digits = t.replace(/\D/g, '');
            if (digits.length !== 11 || !isValidCpf(doc)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Informe um CPF válido.',
                    path: ['document'],
                });
            }
            break;
        }
        case 'cnpj': {
            const digits = t.replace(/\D/g, '');
            if (digits.length !== 14 || !isValidCnpj(doc)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Informe um CNPJ válido.',
                    path: ['document'],
                });
            }
            break;
        }
        default:
            if (!isValidCrefitoRegistration(doc)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'Informe um registro CREFITO válido (UF em letras + número, ex.: MG-123456).',
                    path: ['document'],
                });
            }
    }
}

export const clinicUserNewFormSchema = z
    .object({
        name: z.string().min(1, 'Nome obrigatório'),
        email: z.string().email('E-mail inválido'),
        password: z.string().min(8, 'Mínimo de 8 caracteres'),
        confirmPassword: z.string().min(1, 'Confirme a senha'),
        role: roleEnum.optional(),
        documentKind: documentKindEnum,
        document: z.string(),
    })
    .superRefine((data, ctx) => {
        if (data.role == null) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Função obrigatória',
                path: ['role'],
            });
        }
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'As senhas não coincidem',
                path: ['confirmPassword'],
            });
        }
        addClinicUserDocumentIssues(data, ctx);
    });

export type ClinicUserNewFormValues = z.infer<typeof clinicUserNewFormSchema>;

export function toClinicUserWriteDto(values: ClinicUserNewFormValues): ClinicUserWriteDto {
    if (!values.role) {
        throw new Error('Função obrigatória.');
    }

    return {
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        document: serializeClinicUserDocument(values.documentKind, values.document),
    };
}

export const clinicUserEditFormSchema = z
    .object({
        name: z.string().min(1, 'Nome obrigatório'),
        email: z.string().email('E-mail inválido'),
        password: z.string(),
        confirmPassword: z.string().optional(),
        role: roleEnum,
        documentKind: documentKindEnum,
        document: z.string(),
    })
    .superRefine((data, ctx) => {
        const pwd = data.password ?? '';
        if (pwd.length > 0 && pwd.length < 8) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Mínimo de 8 caracteres',
                path: ['password'],
            });
        }
        if (pwd.length > 0 && (data.confirmPassword ?? '') !== pwd) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'As senhas não coincidem',
                path: ['confirmPassword'],
            });
        }
        addClinicUserDocumentIssues(data, ctx);
    });

export type ClinicUserEditFormValues = z.infer<typeof clinicUserEditFormSchema>;
