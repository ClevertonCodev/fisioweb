import type {
    FinanceListParams,
    FinanceTransactionWriteDto,
    FinancialTransaction,
    MonthlySummary,
    OpeningBalance,
    PaginatedResult,
} from '@/domain/clinic/finance';
import { apiClient } from '@/infrastructure/api/client';

interface ApiCategory {
    id: number;
    name: string;
    type: string;
    origin: string;
    active: boolean;
    display_order: number;
}

interface ApiTransaction {
    id: number;
    date: string;
    description: string;
    category: ApiCategory;
    type: string;
    status: string;
    payment_method: string;
    gross_amount: number | string;
    fee_amount: number | string;
    net_amount: number | string;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    deleted_by?: { id: number; name: string } | null;
}

interface ApiPaginated<T> {
    data: T[];
    meta: { page: number; perPage: number; total: number };
}

function mapCategory(raw: ApiCategory) {
    return {
        id: String(raw.id),
        name: raw.name,
        type: raw.type as FinancialTransaction['type'],
        origin: raw.origin as FinancialTransaction['category']['origin'],
        active: raw.active,
        displayOrder: raw.display_order,
    };
}

function mapTransaction(raw: ApiTransaction): FinancialTransaction {
    return {
        id: String(raw.id),
        date: raw.date,
        description: raw.description,
        category: mapCategory(raw.category),
        type: raw.type as FinancialTransaction['type'],
        status: raw.status as FinancialTransaction['status'],
        paymentMethod:
            raw.payment_method as FinancialTransaction['paymentMethod'],
        grossAmount: Number(raw.gross_amount),
        feeAmount: Number(raw.fee_amount),
        netAmount: Number(raw.net_amount),
        notes: raw.notes,
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
        deletedAt: raw.deleted_at,
        deletedBy: raw.deleted_by
            ? { id: String(raw.deleted_by.id), name: raw.deleted_by.name }
            : null,
    };
}

function toApiWriteDto(dto: FinanceTransactionWriteDto) {
    return {
        date: dto.date,
        description: dto.description,
        financial_category_id: Number(dto.categoryId),
        type: dto.type,
        status: dto.status,
        payment_method: dto.paymentMethod,
        gross_amount: dto.grossAmount,
        fee_amount: dto.feeAmount ?? 0,
        notes: dto.notes ?? null,
    };
}

function buildParams(params: FinanceListParams = {}) {
    const filterPreset =
        params.filterPreset && params.filterPreset !== 'todas'
            ? params.filterPreset
            : undefined;

    return {
        period: params.period,
        type: params.type,
        status: params.status,
        category_id: params.categoryId ? Number(params.categoryId) : undefined,
        payment_method: params.paymentMethod,
        filter_preset: filterPreset,
        q: params.q || undefined,
        sort: params.sort,
        page: params.page,
        per_page: params.perPage,
    };
}

export const apiClinicFinanceTransactionsRepository = {
    async list(
        params: FinanceListParams = {},
    ): Promise<PaginatedResult<FinancialTransaction>> {
        const { data } = await apiClient.get<ApiPaginated<ApiTransaction>>(
            '/clinic/finances/transactions',
            { params: buildParams(params) },
        );
        return {
            data: data.data.map(mapTransaction),
            meta: data.meta,
        };
    },

    async listTrash(
        params: FinanceListParams = {},
    ): Promise<PaginatedResult<FinancialTransaction>> {
        const { data } = await apiClient.get<ApiPaginated<ApiTransaction>>(
            '/clinic/finances/transactions/trash',
            { params: buildParams(params) },
        );
        return {
            data: data.data.map(mapTransaction),
            meta: data.meta,
        };
    },

    async create(
        dto: FinanceTransactionWriteDto,
    ): Promise<FinancialTransaction> {
        const { data } = await apiClient.post<{ data: ApiTransaction }>(
            '/clinic/finances/transactions',
            toApiWriteDto(dto),
        );
        return mapTransaction(data.data);
    },

    async update(
        id: string,
        dto: FinanceTransactionWriteDto,
    ): Promise<FinancialTransaction> {
        const { data } = await apiClient.put<{ data: ApiTransaction }>(
            `/clinic/finances/transactions/${id}`,
            toApiWriteDto(dto),
        );
        return mapTransaction(data.data);
    },

    async remove(id: string): Promise<void> {
        await apiClient.delete(`/clinic/finances/transactions/${id}`);
    },

    async restore(id: string): Promise<FinancialTransaction> {
        const { data } = await apiClient.post<{ data: ApiTransaction }>(
            `/clinic/finances/transactions/${id}/restore`,
        );
        return mapTransaction(data.data);
    },
};

export const apiClinicFinanceSummaryRepository = {
    async getSummary(params: FinanceListParams = {}): Promise<MonthlySummary> {
        const { data } = await apiClient.get<{ data: Record<string, unknown> }>(
            '/clinic/finances/summary',
            { params: buildParams(params) },
        );
        const raw = data.data;
        return {
            period: raw.period as MonthlySummary['period'],
            income: raw.income as MonthlySummary['income'],
            expense: raw.expense as MonthlySummary['expense'],
            openingBalance: Number(raw.opening_balance),
            available: Number(raw.available),
            forecast: Number(raw.forecast),
        };
    },
};

export const apiClinicFinanceOpeningBalanceRepository = {
    async upsert(payload: OpeningBalance): Promise<OpeningBalance> {
        const { data } = await apiClient.put<{ data: Record<string, unknown> }>(
            '/clinic/finances/opening-balance',
            {
                year: payload.year,
                month: payload.month,
                amount: payload.amount,
            },
        );
        return {
            year: Number(data.data.year),
            month: Number(data.data.month),
            amount: Number(data.data.amount),
        };
    },
};
