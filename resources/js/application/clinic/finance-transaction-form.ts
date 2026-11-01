/**
 * Regras puras do modal de lançamento (criar e editar): taxa em R$ ou %,
 * líquido, paciente/atendimento, repetição (parcelado ou recorrente),
 * validação do formulário e o corpo que vai para a API.
 */
import { z } from 'zod';

import type {
    CategoryBreakdownRow,
    FinanceTransactionWriteDto,
    FinancialCategory,
    FinancialTransaction,
    FinancialTransactionStatus,
    FinancialTransactionType,
    PaymentMethod,
} from '@/domain/clinic/finance';

import { parseDate, toDateOnly } from './dates';

/** Como a taxa da maquininha foi digitada. */
export type FeeMode = 'money' | 'percent';

function cents(value: number): number {
    return Math.round(value * 100) / 100;
}

/** A taxa em reais: em %, arredondada em centavos (3% de R$ 100 = R$ 3,00). */
export function feeInReais(
    amount: number | null,
    mode: FeeMode,
    fee: number | null,
): number {
    if (!amount || !fee) return 0;
    return mode === 'percent' ? Math.round(amount * fee) / 100 : cents(fee);
}

/** O líquido: valor menos a taxa, nunca abaixo de zero. */
export function netOf(amount: number | null, fee: number): number {
    return Math.max(0, cents((amount ?? 0) - fee));
}

/** Cartão de crédito e de débito pedem a taxa; outro método só se já tem taxa. */
export function showsFee(method: PaymentMethod, fee: number): boolean {
    return method === 'cartao_credito' || method === 'cartao_debito' || fee > 0;
}

/** "3" ou "2,5" vira número; vazio vira null. */
export function parsePercent(raw: string): number | null {
    const text = raw.trim().replace(',', '.');
    if (text === '') return null;
    const value = Number(text);
    return Number.isFinite(value) ? value : Number.NaN;
}

/** Número de parcelas digitado: inteiro de 2 a 48, ou null. */
export function parseInstallments(raw: string): number | null {
    const text = raw.trim();
    if (!/^\d+$/.test(text)) return null;
    const value = Number(text);
    return value >= 2 && value <= 48 ? value : null;
}

/**
 * O valor de cada parcela, como o servidor divide: o total ÷ N truncado em
 * centavos, e o centavo que sobra na 1ª (R$ 100 em 3x = 33,34 + 33,33 + 33,33).
 */
export function installmentAmounts(
    amount: number | null,
    total: number,
): { first: number; others: number } | null {
    if (!amount || amount <= 0 || total < 2) return null;
    const cents = Math.round(amount * 100);
    const base = Math.floor(cents / total);
    return { first: (cents - base * (total - 1)) / 100, others: base / 100 };
}

export const transactionFormSchema = z
    .object({
        type: z.enum(['entrada', 'saida']),
        amount: z.number().nullable(),
        description: z.string().max(255, 'Use até 255 caracteres.'),
        categoryId: z.string(),
        date: z.date().nullable(),
        status: z.enum(['recebido', 'pago', 'pendente']),
        paymentMethod: z.enum([
            'dinheiro',
            'pix',
            'cartao_debito',
            'cartao_credito',
            'transferencia',
            'boleto',
            'outro',
        ]),
        feeMode: z.enum(['money', 'percent']),
        // Opcionais: o campo da taxa sai da tela (outra forma de pagamento,
        // ou o outro lado do R$ / %) e o RHF desregistra o valor.
        feeAmount: z.number().nullish(),
        feePercent: z.string().optional(),
        notes: z.string(),
        // Repetir (só no lançamento novo): não repete, parcelado ou
        // recorrente. Opcionais: o campo sai da tela na edição.
        repeatKind: z.enum(['none', 'installments', 'recurrence']).optional(),
        installments: z.string().optional(),
        frequency: z.enum(['weekly', 'monthly', 'yearly']).optional(),
        // "Sem data para acabar" ou "até" a data `endsOn`.
        endsMode: z.enum(['never', 'until']).optional(),
        endsOn: z.date().nullish(),
        // Paciente e atendimento (só na entrada). `undefined`: nunca teve
        // paciente (não vai para a API); `null`: tirou o paciente.
        patientId: z.string().nullish(),
        patientName: z.string().nullish(),
        appointmentId: z.string().nullish(),
    })
    .superRefine((v, ctx) => {
        if (!v.amount || v.amount <= 0) {
            ctx.addIssue({
                code: 'custom',
                path: ['amount'],
                message: 'Informe o valor.',
            });
        }
        if (!v.description.trim()) {
            ctx.addIssue({
                code: 'custom',
                path: ['description'],
                message: 'Descreva o lançamento.',
            });
        }
        if (!v.categoryId) {
            ctx.addIssue({
                code: 'custom',
                path: ['categoryId'],
                message: 'Escolha a categoria.',
            });
        }
        if (!v.date) {
            ctx.addIssue({
                code: 'custom',
                path: ['date'],
                message: 'Escolha a data.',
            });
        }
        const installmentsTotal =
            v.repeatKind === 'installments'
                ? parseInstallments(v.installments ?? '')
                : null;
        if (v.repeatKind === 'installments' && installmentsTotal === null) {
            ctx.addIssue({
                code: 'custom',
                path: ['installments'],
                message: 'Informe de 2 a 48 parcelas.',
            });
        }
        // Cada parcela leva pelo menos R$ 0,01 (R$ 0,02 em 3x daria parcelas
        // de R$ 0,00), como no StoreFinancialTransactionRequest.
        if (
            installmentsTotal !== null &&
            v.amount &&
            v.amount > 0 &&
            Math.round(v.amount * 100) < installmentsTotal
        ) {
            ctx.addIssue({
                code: 'custom',
                path: ['amount'],
                message: `Em ${installmentsTotal} parcelas, o valor precisa ser de pelo menos R$ ${(installmentsTotal / 100).toFixed(2).replace('.', ',')}.`,
            });
        }
        if (v.repeatKind === 'recurrence' && v.endsMode === 'until') {
            if (!v.endsOn) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endsOn'],
                    message: 'Escolha até quando repete.',
                });
            } else if (
                v.date &&
                (toDateOnly(v.endsOn) ?? '') < (toDateOnly(v.date) ?? '')
            ) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['endsOn'],
                    message: 'O fim não pode ser antes da data.',
                });
            }
        }
        if (v.feeMode === 'percent') {
            const pct = parsePercent(v.feePercent ?? '');
            if (pct !== null && (Number.isNaN(pct) || pct < 0 || pct > 100)) {
                ctx.addIssue({
                    code: 'custom',
                    path: ['feePercent'],
                    message: 'Informe uma porcentagem entre 0 e 100.',
                });
            }
        }
    });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

/** Recebido (entrada) ou pago (saída). */
export function doneStatus(
    type: FinancialTransactionType,
): FinancialTransactionStatus {
    return type === 'entrada' ? 'recebido' : 'pago';
}

/** Valores iniciais: um lançamento novo de hoje, ou o que está sendo editado. */
export function transactionFormDefaults(
    type: FinancialTransactionType,
    editing?: FinancialTransaction,
    today: Date = new Date(),
): TransactionFormValues {
    if (editing) {
        return {
            type: editing.type,
            amount: editing.grossAmount,
            description: editing.description,
            categoryId: editing.category.id,
            date: parseDate(editing.date.slice(0, 10)),
            status: editing.status,
            paymentMethod: editing.paymentMethod,
            feeMode: 'money',
            feeAmount: editing.feeAmount || null,
            feePercent: '',
            notes: editing.notes ?? '',
            repeatKind: 'none',
            installments: '2',
            frequency: 'monthly',
            endsMode: 'never',
            endsOn: null,
            patientId: editing.patient?.id,
            patientName: editing.patient?.name ?? null,
            appointmentId: editing.appointment?.id ?? null,
        };
    }
    return {
        type,
        amount: null,
        description: '',
        categoryId: '',
        date: today,
        status: doneStatus(type),
        paymentMethod: 'pix',
        feeMode: 'money',
        feeAmount: null,
        feePercent: '',
        notes: '',
        repeatKind: 'none',
        installments: '2',
        frequency: 'monthly',
        endsMode: 'never',
        endsOn: null,
        patientId: undefined,
        patientName: null,
        appointmentId: null,
    };
}

/** A taxa em reais que o formulário representa agora (0 quando escondida). */
export function feeOfValues(v: TransactionFormValues): number {
    const fee = feeInReais(
        v.amount,
        v.feeMode,
        v.feeMode === 'percent'
            ? parsePercent(v.feePercent ?? '')
            : (v.feeAmount ?? null),
    );
    const safe = Number.isNaN(fee) ? 0 : fee;
    return showsFee(v.paymentMethod, safe) ? safe : 0;
}

/**
 * Trocar o seletor R$ / % leva o mesmo valor para o outro campo
 * (R$ 5 de R$ 200 vira "2,5"; 3% de R$ 100 vira R$ 3,00).
 */
export function switchFeeMode(
    v: TransactionFormValues,
    next: FeeMode,
): Pick<TransactionFormValues, 'feeMode' | 'feeAmount' | 'feePercent'> {
    if (next === 'money') {
        const fee = feeInReais(
            v.amount,
            v.feeMode,
            parsePercent(v.feePercent ?? ''),
        );
        return {
            feeMode: 'money',
            feeAmount:
                v.feeMode === 'percent' ? fee || null : (v.feeAmount ?? null),
            feePercent: v.feePercent ?? '',
        };
    }
    const fee = v.feeMode === 'money' ? (v.feeAmount ?? 0) : 0;
    const pct =
        v.amount && fee ? Math.round((fee / v.amount) * 10000) / 100 : null;
    return {
        feeMode: 'percent',
        feeAmount: v.feeAmount ?? null,
        feePercent:
            pct === null ? (v.feePercent ?? '') : String(pct).replace('.', ','),
    };
}

/** O corpo do POST/PUT, com a taxa sempre em reais. */
export function toTransactionWriteDto(
    v: TransactionFormValues,
): FinanceTransactionWriteDto {
    return {
        date: toDateOnly(v.date) ?? '',
        description: v.description.trim(),
        categoryId: v.categoryId,
        type: v.type,
        status: v.status,
        paymentMethod: v.paymentMethod,
        grossAmount: v.amount ?? 0,
        feeAmount: feeOfValues(v),
        notes: v.notes.trim() ? v.notes.trim() : null,
        // Na entrada, vão quando há (ou houve) paciente: null tira. Na saída
        // não vão e o servidor limpa o que a entrada tinha.
        ...(v.type === 'entrada' && v.patientId !== undefined
            ? {
                  patientId: v.patientId || null,
                  appointmentId: (v.patientId && v.appointmentId) || null,
              }
            : {}),
        ...(v.repeatKind === 'installments'
            ? {
                  repeat: {
                      kind: 'installments' as const,
                      total: parseInstallments(v.installments ?? '') ?? 0,
                  },
              }
            : {}),
        ...(v.repeatKind === 'recurrence'
            ? {
                  repeat: {
                      kind: 'recurrence' as const,
                      frequency: v.frequency ?? 'monthly',
                      endsOn:
                          v.endsMode === 'until'
                              ? toDateOnly(v.endsOn ?? null)
                              : null,
                  },
              }
            : {}),
    };
}

/** Campo da API → campo do formulário, para mostrar o 422 no lugar certo. */
export function formFieldOfApiError(
    apiField: string,
    feeMode: FeeMode,
): keyof TransactionFormValues | null {
    const map: Record<string, keyof TransactionFormValues> = {
        gross_amount: 'amount',
        description: 'description',
        financial_category_id: 'categoryId',
        date: 'date',
        status: 'status',
        payment_method: 'paymentMethod',
        notes: 'notes',
        type: 'type',
        fee_amount: feeMode === 'percent' ? 'feePercent' : 'feeAmount',
        'repeat.total': 'installments',
        'repeat.kind': 'repeatKind',
        'repeat.frequency': 'frequency',
        'repeat.ends_on': 'endsOn',
        patient_id: 'patientId',
        appointment_id: 'appointmentId',
    };
    return map[apiField] ?? null;
}

/**
 * As categorias mais usadas no mês para o tipo, pela contagem do servidor
 * (`category-breakdown`), só as ligadas, da mais usada para a menos usada.
 */
export function topCategories(
    rows: CategoryBreakdownRow[],
    categories: FinancialCategory[],
    type: FinancialTransactionType,
    limit = 5,
): FinancialCategory[] {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return rows
        .filter((r) => r.type === type && r.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((r) => byId.get(String(r.categoryId)))
        .filter(
            (c): c is FinancialCategory => !!c && c.active && c.type === type,
        )
        .slice(0, limit);
}
