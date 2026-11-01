import type {
    FinanceListParams,
    FinanceTransactionWriteDto,
    FinancialTransaction,
    MonthlySummary,
    PaginatedResult,
    SeriesScope,
    TransactionRepeat,
    TransactionSeries,
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
    series?: {
        id: number;
        kind: string;
        index: number;
        total: number | null;
    } | null;
    attachments_count?: number;
    patient?: { id: number; name: string | null } | null;
    appointment?: { id: number; starts_at: string | null } | null;
}

interface ApiPaginated<T> {
    data: T[];
    meta: {
        page: number;
        perPage: number;
        total: number;
        netTotal?: number | string;
    };
}

function mapMeta(
    meta: ApiPaginated<unknown>['meta'],
): PaginatedResult<unknown>['meta'] {
    const { netTotal, ...rest } = meta;
    return netTotal === undefined || netTotal === null
        ? rest
        : { ...rest, netTotal: Number(netTotal) };
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
        series: raw.series
            ? {
                  id: String(raw.series.id),
                  kind: raw.series.kind as TransactionSeries['kind'],
                  index: raw.series.index,
                  total: raw.series.total,
              }
            : null,
        attachmentsCount: raw.attachments_count,
        patient: raw.patient
            ? { id: String(raw.patient.id), name: raw.patient.name }
            : null,
        appointment: raw.appointment
            ? {
                  id: String(raw.appointment.id),
                  startsAt: raw.appointment.starts_at,
              }
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
        // Paciente e atendimento: só na entrada (na saída não vão e o servidor limpa).
        ...(dto.patientId !== undefined
            ? {
                  patient_id: dto.patientId ? Number(dto.patientId) : null,
                  appointment_id: dto.appointmentId
                      ? Number(dto.appointmentId)
                      : null,
              }
            : {}),
        // Sem repetição, o campo não vai (o servidor trata como "não repete").
        ...(dto.repeat && dto.repeat.kind !== 'none'
            ? { repeat: toApiRepeat(dto.repeat) }
            : {}),
    };
}

function toApiRepeat(repeat: Exclude<TransactionRepeat, { kind: 'none' }>) {
    return repeat.kind === 'recurrence'
        ? {
              kind: repeat.kind,
              frequency: repeat.frequency,
              ends_on: repeat.endsOn,
          }
        : repeat;
}

function buildParams(params: FinanceListParams = {}) {
    const filterPreset =
        params.filterPreset && params.filterPreset !== 'todas'
            ? params.filterPreset
            : undefined;

    return {
        period: params.period,
        from: params.from,
        to: params.to,
        overdue_until: params.overdueUntil,
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
            meta: mapMeta(data.meta),
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
            meta: mapMeta(data.meta),
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

    /** `scope` só no lançamento de série; a repetição não muda na edição. */
    async update(
        id: string,
        dto: FinanceTransactionWriteDto,
        scope?: SeriesScope,
    ): Promise<FinancialTransaction> {
        const { data } = await apiClient.put<{ data: ApiTransaction }>(
            `/clinic/finances/transactions/${id}`,
            {
                ...toApiWriteDto({ ...dto, repeat: undefined }),
                ...(scope ? { scope } : {}),
            },
        );
        return mapTransaction(data.data);
    },

    async remove(id: string, scope?: SeriesScope): Promise<void> {
        const url = `/clinic/finances/transactions/${id}`;
        if (scope) await apiClient.delete(url, { params: { scope } });
        else await apiClient.delete(url);
    },

    async restore(id: string): Promise<FinancialTransaction> {
        const { data } = await apiClient.post<{ data: ApiTransaction }>(
            `/clinic/finances/transactions/${id}/restore`,
        );
        return mapTransaction(data.data);
    },

    /** Baixa em um clique (e o "Desfazer"): muda só o status. */
    async setStatus(
        id: string,
        status: FinancialTransaction['status'],
    ): Promise<FinancialTransaction> {
        const { data } = await apiClient.patch<{ data: ApiTransaction }>(
            `/clinic/finances/transactions/${id}/status`,
            { status },
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
            openingBalanceSource:
                raw.opening_balance_source === 'typed' ? 'typed' : 'computed',
            available: Number(raw.available),
            forecast: Number(raw.forecast),
        };
    },
};
