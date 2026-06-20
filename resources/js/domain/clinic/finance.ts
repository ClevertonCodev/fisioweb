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
}

export interface MonthlySummary {
    period: { year: number; month: number };
    income: { received: number; pending: number };
    expense: { paid: number; pending: number };
    openingBalance: number;
    available: number;
    forecast: number;
}

export interface OpeningBalance {
    year: number;
    month: number;
    amount: number;
}

export interface FinanceListParams {
    period?: string;
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

export interface FinanceFilters {
    filterPreset: FinanceFilterPreset;
    categoryId?: string;
    paymentMethod?: PaymentMethod;
    q: string;
}

export const FILTER_PRESET_LABELS: Record<FinanceFilterPreset, string> = {
    todas: 'Todas as transações',
    entradas: 'Entradas',
    entradas_recebidas: 'Entradas recebidas',
    entradas_pendentes: 'Entradas não recebidas',
    saidas: 'Saídas',
    saidas_concluidas: 'Saídas concluídas',
    saidas_pendentes: 'Saídas pendentes',
};

export const DEFAULT_FINANCE_FILTERS: FinanceFilters = {
    filterPreset: 'todas',
    q: '',
};

export interface PaginatedResult<T> {
    data: T[];
    meta: { page: number; perPage: number; total: number };
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

export interface CategoryDistributionPoint {
    categoryId: number;
    name: string;
    type: FinancialTransactionType;
    total: number;
    percentage: number;
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
