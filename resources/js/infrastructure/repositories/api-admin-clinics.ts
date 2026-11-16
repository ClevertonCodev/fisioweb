import type {
    ClinicWriteDto,
    ClinicsRepository,
} from '@/application/admin/ports';
import type { Clinic, LoginAsEntry, MasterAccess } from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

/** DTO interno — shape da API (infra concern) */
interface ApiClinicDto {
    id: number;
    name: string;
    document: string;
    type_person: string;
    status: number;
    email: string;
    phone?: string | null;
    slug?: string;
    zip_code?: string | null;
    address?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
    plan_id?: number | null;
    plan?: { id: number; name: string } | null;
    created_at: string;
    master_password_defined?: boolean;
    first_access_link_created_at?: string | null;
    recent_login_as?: ApiLoginAsEntry[];
}

interface ApiLoginAsEntry {
    operator_name: string;
    clinic_user_name: string | null;
    created_at: string;
}

function toRecentLoginAs(r: Record<string, unknown>): LoginAsEntry[] {
    if (!Array.isArray(r.recent_login_as)) return [];
    return (r.recent_login_as as ApiLoginAsEntry[]).map((entry) => ({
        operatorName: entry.operator_name,
        clinicUserName: entry.clinic_user_name ?? null,
        createdAt: entry.created_at,
    }));
}

function toMasterAccess(r: Record<string, unknown>): MasterAccess | null {
    if (typeof r.master_password_defined !== 'boolean') return null;
    return {
        passwordDefined: r.master_password_defined,
        lastLinkCreatedAt: (r.first_access_link_created_at as string) ?? null,
    };
}

/** Mapper: API DTO → Domain Entity */
function toClinic(raw: ApiClinicDto | Record<string, unknown>): Clinic {
    const r = raw as Record<string, unknown>;
    const plan = r.plan as { id: number; name: string } | undefined | null;
    const typePerson = r.type_person === 'juridica' ? 'PJ' : 'PF';
    return {
        id: r.id as number,
        name: r.name as string,
        document: r.document as string,
        typePerson,
        status: ((r.status as number) ?? 0) as -1 | 0 | 1,
        email: r.email as string,
        phone: (r.phone as string) ?? null,
        slug: (r.slug as string) ?? '',
        zipCode: (r.zip_code as string) ?? null,
        address: (r.address as string) ?? null,
        number: (r.number as string) ?? null,
        city: (r.city as string) ?? null,
        state: (r.state as string) ?? null,
        planId: (r.plan_id as number) ?? null,
        planName: plan?.name ?? null,
        createdAt: r.created_at as string,
        masterAccess: toMasterAccess(r),
        recentLoginAs: toRecentLoginAs(r),
    };
}

/** Mapper: Domain Write DTO → API payload */
function toApiPayload(
    dto: ClinicWriteDto | Omit<ClinicWriteDto, 'password'>,
): Record<string, unknown> {
    return {
        name: dto.name,
        type_person: dto.typePerson === 'PJ' ? 'juridica' : 'fisica',
        document: dto.document,
        email: dto.email,
        phone: dto.phone ?? null,
        status: dto.status,
        slug: dto.slug ?? null,
        plan_id: dto.planId ?? null,
        zip_code: dto.zipCode ?? null,
        address: dto.address ?? null,
        number: dto.number ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
        ...('password' in dto && dto.password
            ? { password: dto.password }
            : {}),
    };
}

export const apiClinicsRepository: ClinicsRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<{ data: unknown }>(
            '/admin/clinics',
            {
                params: {
                    per_page: params.per_page ?? 500,
                    page: params.page ?? 1,
                    ...params,
                },
            },
        );
        const body = data as { data?: unknown[] | { data?: unknown[] } };
        const raw = body?.data;
        const items = Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === 'object' &&
                Array.isArray((raw as { data?: unknown[] }).data)
              ? (raw as { data: unknown[] }).data
              : [];
        return items.map((c) => toClinic(c as Record<string, unknown>));
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: unknown }>(
            `/admin/clinics/${id}`,
        );
        if (!data?.data) return null;
        return toClinic((data as { data: Record<string, unknown> }).data);
    },

    async getPlansOptions() {
        const { data } = await apiClient.get<{ data: unknown }>(
            '/admin/plans',
            {
                params: { per_page: 100 },
            },
        );
        const body = data as { data?: unknown[] | { data?: unknown[] } };
        const raw = body?.data;
        const items = Array.isArray(raw)
            ? raw
            : raw &&
                typeof raw === 'object' &&
                Array.isArray((raw as { data?: unknown[] }).data)
              ? (raw as { data: unknown[] }).data
              : [];
        return items.map((p: Record<string, unknown>) => ({
            id: p.id as number,
            name: p.name as string,
        }));
    },

    async create(payload) {
        const { data } = await apiClient.post<{ data: unknown }>(
            '/admin/clinics',
            toApiPayload(payload),
        );
        return toClinic((data as { data: Record<string, unknown> }).data);
    },

    async update(id, payload) {
        const { data } = await apiClient.put<{ data: unknown }>(
            `/admin/clinics/${id}`,
            toApiPayload(payload),
        );
        return toClinic((data as { data: Record<string, unknown> }).data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/clinics/${id}`);
    },

    async reactivate(id) {
        const { data } = await apiClient.put<{ data: unknown }>(
            `/admin/clinics/${id}/reactivate`,
        );
        return toClinic((data as { data: Record<string, unknown> }).data);
    },

    async generateFirstAccessLink(id) {
        const { data } = await apiClient.post<{
            data: { url: string; created_at: string };
        }>(`/admin/clinics/${id}/first-access-link`);
        return { url: data.data.url, createdAt: data.data.created_at };
    },

    async loginAs(id) {
        const { data } = await apiClient.post(`/admin/clinics/${id}/login-as`);
        return data as {
            access_token: string;
            token_type: string;
            expires_in: number;
            user: { id: number; name: string; email: string };
        };
    },
};
