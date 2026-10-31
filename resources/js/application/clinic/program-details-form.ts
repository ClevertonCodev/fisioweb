import { z } from 'zod';

/** Hoje, à meia-noite local. */
export function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

/**
 * A etapa final do assistente. O início não vai antes de hoje, a não ser que
 * seja o início que o programa já tinha (edição de um programa que começou no
 * passado). O término nunca antes do início.
 */
export function programDetailsSchema(keptStart: Date | null) {
    return z
        .object({
            title: z
                .string()
                .trim()
                .min(1, 'Dê um nome ao programa')
                .max(255, 'Até 255 caracteres'),
            patientId: z.string(),
            startDate: z.date().nullable(),
            endDate: z.date().nullable(),
            message: z.string().max(600, 'Até 600 caracteres'),
        })
        .refine(
            (v) =>
                !v.startDate ||
                v.startDate >= startOfToday() ||
                (keptStart !== null &&
                    v.startDate.getTime() === keptStart.getTime()),
            {
                path: ['startDate'],
                message: 'O início não pode ser no passado',
            },
        )
        .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
            path: ['endDate'],
            message: 'O término vem antes do início',
        });
}

export type ProgramDetailsForm = z.infer<
    ReturnType<typeof programDetailsSchema>
>;
