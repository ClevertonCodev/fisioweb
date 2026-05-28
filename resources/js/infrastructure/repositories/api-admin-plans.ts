import type { FeaturePlanWriteDto, PlanWriteDto, PlansRepository } from '@/application/admin/ports';
import type { FeaturePlan, Plan } from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

/** DTO interno — shape da API (infra concern) */
interface ApiPlanDto {
    id: number;
    name: string;
    type_charge: string;
    value_month: number | string;
    value_year: number | string;
    created_at?: string;
    updated_at?: string;
}

/** Mapper: API DTO → Domain Entity */
function toPlan(raw: ApiPlanDto | Record<string, unknown>): Plan {
    const r = raw as Record<string, unknown>;
    const typeCharge = (r.type_charge ?? r.billing_type) as string | undefined;
    const billingType: Plan['billingType'] =
        typeCharge === 'por_usuario'
            ? 'per_user'
            : typeCharge === 'per_user'
              ? 'per_user'
              : 'fixed';
    return {
        id: r.id as number,
        name: r.name as string,
        billingType,
        monthlyValue: Number(r.value_month ?? 0),
        annualValue: Number(r.value_year ?? 0),
    };
}

/** Mapper: Domain Write DTO → API payload */
function toApiPayload(dto: PlanWriteDto): Record<string, unknown> {
    return {
        name: dto.name,
        type_charge: dto.billingType === 'per_user' ? 'por_usuario' : 'fixo',
        value_month: dto.monthlyValue,
        value_year: dto.annualValue,
    };
}

function toFeaturePlan(raw: Record<string, unknown>): FeaturePlan {
    return {
        id: raw.id as number,
        plan_id: raw.plan_id as number,
        feature_id: raw.feature_id as number,
        value: Boolean(raw.value),
        created_at: (raw.created_at as string) ?? '',
        updated_at: (raw.updated_at as string) ?? '',
    };
}

function toFeaturePlanApiPayload(dto: FeaturePlanWriteDto): Record<string, unknown> {
    return {
        plan_id: dto.planId,
        feature_id: dto.featureId,
        value: dto.value,
    };
}

export const apiPlansRepository: PlansRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<{ data: unknown }>('/admin/plans', {
            params: {
                per_page: params.per_page ?? 500,
                page: params.page ?? 1,
                search: params.search,
            },
        });
        const body = data as { data?: unknown[] | { data?: unknown[] } };
        const raw = body?.data;
        const items = Array.isArray(raw)
            ? raw
            : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)
              ? (raw as { data: unknown[] }).data
              : [];
        return items.map((p) => toPlan(p as ApiPlanDto));
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: unknown }>(`/admin/plans/${id}`);
        if (!data?.data) return null;
        return toPlan((data as { data: ApiPlanDto }).data);
    },

    async getFeaturePlans(params = {}) {
        const { data } = await apiClient.get<{ data: unknown }>('/admin/feature-plans', {
            params: { per_page: 500, ...params },
        });
        const body = data as { data?: unknown[] | { data?: unknown[] } };
        const raw = body?.data;
        const items = Array.isArray(raw)
            ? raw
            : raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown[] }).data)
              ? (raw as { data: unknown[] }).data
              : [];
        return items.map((fp) => toFeaturePlan(fp as Record<string, unknown>));
    },

    async createFeaturePlan(payload: FeaturePlanWriteDto) {
        const { data } = await apiClient.post<{ data: Record<string, unknown> }>(
            '/admin/feature-plans',
            toFeaturePlanApiPayload(payload),
        );
        return toFeaturePlan(data.data);
    },

    async destroyFeaturePlan(id: number) {
        await apiClient.delete(`/admin/feature-plans/${id}`);
    },

    async create(payload: PlanWriteDto) {
        const { data } = await apiClient.post<{ data: ApiPlanDto }>(
            '/admin/plans',
            toApiPayload(payload),
        );
        return toPlan(data.data);
    },

    async update(id: number, payload: PlanWriteDto) {
        const { data } = await apiClient.put<{ data: ApiPlanDto }>(
            `/admin/plans/${id}`,
            toApiPayload(payload),
        );
        return toPlan(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/plans/${id}`);
    },
};
