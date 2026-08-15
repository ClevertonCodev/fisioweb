import { z } from 'zod';

export function normalizeCpf(value: string): string {
    return value.replace(/\D/g, '');
}

export function isEmailIdentifier(value: string): boolean {
    return value.includes('@');
}

export const patientLoginFormSchema = z.object({
    identifier: z
        .string()
        .min(1, 'Informe seu CPF ou e-mail.')
        .refine(
            (value) =>
                isEmailIdentifier(value)
                    ? z.string().email().safeParse(value.trim()).success
                    : normalizeCpf(value).length === 11,
            'Digite um CPF com 11 dígitos ou um e-mail válido.',
        ),
    password: z.string().min(1, 'Informe sua senha.'),
});

export type PatientLoginFormValues = z.infer<typeof patientLoginFormSchema>;

export const patientIdentifierFormSchema = patientLoginFormSchema.pick({
    identifier: true,
});

export type PatientIdentifierFormValues = z.infer<
    typeof patientIdentifierFormSchema
>;
