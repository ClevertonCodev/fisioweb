import { z } from 'zod';

/** Só dígitos — mesma normalização aplicada no backend. */
export function normalizeCpf(value: string): string {
    return value.replace(/\D/g, '');
}

export function isEmailIdentifier(value: string): boolean {
    return value.includes('@');
}

/**
 * O refino de formato é conveniência de UX: orienta antes do envio.
 * O backend não replica essa checagem de propósito — rejeitar um CPF
 * matematicamente inválido lá revelaria quais valores sequer são consultados.
 */
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

/** Passo do identificador, quando a clínica ainda não é conhecida. */
export const patientIdentifierFormSchema = patientLoginFormSchema.pick({
    identifier: true,
});

export type PatientIdentifierFormValues = z.infer<
    typeof patientIdentifierFormSchema
>;
