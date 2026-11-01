export type FinancialTransactionType = 'entrada' | 'saida';

export type FinancialTransactionStatus = 'recebido' | 'pendente' | 'pago';

export type PaymentMethod =
    | 'dinheiro'
    | 'pix'
    | 'cartao_debito'
    | 'cartao_credito'
    | 'transferencia'
    | 'boleto'
    | 'outro';

export type FinancialCategoryOrigin = 'system' | 'custom';

export interface FinancialCategory {
    id: string;
    name: string;
    type: FinancialTransactionType;
    origin: FinancialCategoryOrigin;
    active: boolean;
    displayOrder: number;
}

export interface FinancialTransaction {
    id: string;
    date: string;
    description: string;
    category: FinancialCategory;
    type: FinancialTransactionType;
    status: FinancialTransactionStatus;
    paymentMethod: PaymentMethod;
    grossAmount: number;
    feeAmount: number;
    netAmount: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
    deletedBy?: { id: string; name: string } | null;
    /** Parcela ou ocorrência de uma série; `null` no lançamento avulso. */
    series?: TransactionSeries | null;
    /** Quantos comprovantes o lançamento tem (vem na listagem). */
    attachmentsCount?: number;
    /** Quem pagou a entrada; `null` sem paciente. */
    patient?: TransactionPatient | null;
    /** O atendimento da agenda que a entrada paga; `null` sem atendimento. */
    appointment?: TransactionAppointment | null;
}

/** O paciente da entrada: só id e nome. */
export interface TransactionPatient {
    id: string;
    name: string | null;
}

/** O atendimento ligado à entrada. */
export interface TransactionAppointment {
    id: string;
    startsAt: string | null;
}

/** Um atendimento do paciente, para o seletor do modal. */
export interface FinancePatientAppointment {
    id: string;
    startsAt: string;
    title: string | null;
}

export type FinancialSeriesKind = 'installments' | 'recurrence';

/** A posição do lançamento na série: "2/6" no parcelamento (`total` só nele). */
export interface TransactionSeries {
    id: string;
    kind: FinancialSeriesKind;
    index: number;
    total: number | null;
}

/** De quanto em quanto a recorrência se repete. */
export type RecurrenceFrequency = 'weekly' | 'monthly' | 'yearly';

/** "Repetir" do lançamento novo; na recorrência, `endsOn` nulo é "sem data para acabar". */
export type TransactionRepeat =
    | { kind: 'none' }
    | { kind: 'installments'; total: number }
    | {
          kind: 'recurrence';
          frequency: RecurrenceFrequency;
          endsOn: string | null;
      };

/** Editar ou excluir um lançamento de série: só este, ou este e os próximos pendentes. */
export type SeriesScope = 'only' | 'following';

export interface MonthlySummary {
    period: { year: number; month: number };
    income: { received: number; pending: number };
    expense: { paid: number; pending: number };
    openingBalance: number;
    openingBalanceSource: OpeningBalanceSource;
    available: number;
    forecast: number;
}

/** Saldo inicial digitado no mês, ou calculado do mês anterior. */
export type OpeningBalanceSource = 'typed' | 'computed';

export interface OpeningBalance {
    year: number;
    month: number;
    amount: number;
}

/** Entrou e saiu num dia (líquido, todos os status), somado no servidor. */
export interface FinanceCalendarDay {
    date: string;
    income: number;
    expense: number;
}

/** Só os dias do mês que têm lançamento. */
export interface FinanceCalendarMonth {
    period: string;
    days: FinanceCalendarDay[];
}

export interface FinanceListParams {
    period?: string;
    /** YYYY-MM-DD, sem `period`: com `period`, o servidor ignora `from` e `to`. */
    from?: string;
    to?: string;
    /**
     * YYYY-MM-DD (o fim do mês na tela): só pendências com data até esse dia,
     * com as atrasadas de antes, da mais antiga para a mais nova. Ignora `period`.
     */
    overdueUntil?: string;
    type?: FinancialTransactionType;
    status?: FinancialTransactionStatus;
    categoryId?: string;
    paymentMethod?: PaymentMethod;
    filterPreset?: FinanceFilterPreset;
    q?: string;
    sort?: string;
    page?: number;
    perPage?: 10 | 25 | 50;
}

export type FinanceFilterPreset =
    | 'todas'
    | 'entradas'
    | 'entradas_recebidas'
    | 'entradas_pendentes'
    | 'saidas'
    | 'saidas_concluidas'
    | 'saidas_pendentes';

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        /** Soma líquida de todas as páginas; só vem com `overdueUntil`. */
        netTotal?: number;
    };
}

export interface ReportSummary {
    period: { year: number; month: number };
    totals: { income: number; expense: number; balance: number };
    variation: {
        income: number | null;
        expense: number | null;
        balance: number | null;
    };
}

export interface IncomeVsExpensePoint {
    date: string;
    income: number;
    expense: number;
}

export interface MonthlyComparisonPoint {
    year: number;
    month: number;
    income: number;
    expense: number;
}

export interface CategoryBreakdownRow {
    categoryId: number;
    name: string;
    type: FinancialTransactionType;
    count: number;
    total: number;
    percentage: number;
}

export interface FinanceTransactionWriteDto {
    date: string;
    description: string;
    categoryId: string;
    type: FinancialTransactionType;
    status: FinancialTransactionStatus;
    paymentMethod: PaymentMethod;
    grossAmount: number;
    feeAmount?: number;
    notes?: string | null;
    /** Só no lançamento novo; sem repetição, não vai. */
    repeat?: TransactionRepeat;
    /** Só na entrada; `null` tira o paciente. Na saída não vai (o servidor limpa). */
    patientId?: string | null;
    /** Atendimento do paciente escolhido; `null` sem atendimento. */
    appointmentId?: string | null;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    dinheiro: 'Dinheiro',
    pix: 'Pix',
    cartao_debito: 'Cartão de débito',
    cartao_credito: 'Cartão de crédito',
    transferencia: 'Transferência',
    boleto: 'Boleto',
    outro: 'Outro',
};

export const STATUS_LABELS: Record<FinancialTransactionStatus, string> = {
    recebido: 'Recebido',
    pendente: 'Pendente',
    pago: 'Pago',
};
