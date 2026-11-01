/**
 * Formulário de exportar lançamentos: período (este mês, mês passado ou
 * datas escolhidas) e formato. Espelha o `ExportFinancialTransactionsRequest`:
 * em "Escolher datas", "De" e "Até" são obrigatórios e o "Até" não vem antes.
 * Cada erro fica no próprio campo (`start` ou `end`).
 */
import { z } from 'zod';

import { toDateOnly } from './dates';
import type { FinanceExportParams } from './use-finance-export';

export const financeExportFormSchema = z
    .object({
        range: z.enum(['current_month', 'previous_month', 'custom']),
        start: z.date().nullable(),
        end: z.date().nullable(),
        format: z.enum(['csv', 'xlsx', 'pdf']),
    })
    .superRefine((v, ctx) => {
        if (v.range !== 'custom') return;
        if (!v.start) {
            ctx.addIssue({
                code: 'custom',
                path: ['start'],
                message: 'Escolha a data de início.',
            });
        }
        if (!v.end) {
            ctx.addIssue({
                code: 'custom',
                path: ['end'],
                message: 'Escolha a data de fim.',
            });
        }
        if (
            v.start &&
            v.end &&
            (toDateOnly(v.end) ?? '') < (toDateOnly(v.start) ?? '')
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['end'],
                message: 'O fim não pode ser antes do início.',
            });
        }
    });

export type FinanceExportFormValues = z.infer<typeof financeExportFormSchema>;

export const financeExportFormDefaults: FinanceExportFormValues = {
    range: 'current_month',
    start: null,
    end: null,
    format: 'xlsx',
};

/** O que vai para a API: as datas só em "Escolher datas". */
export function toFinanceExportParams(
    values: FinanceExportFormValues,
): FinanceExportParams {
    const custom = values.range === 'custom';
    return {
        format: values.format,
        range: values.range,
        from: custom ? (toDateOnly(values.start) ?? undefined) : undefined,
        to: custom ? (toDateOnly(values.end) ?? undefined) : undefined,
    };
}
