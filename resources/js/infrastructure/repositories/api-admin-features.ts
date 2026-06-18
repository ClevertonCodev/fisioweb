import type {
    FeatureCreateOptions,
    FeatureWriteDto,
    FeaturesRepository,
} from '@/application/admin/ports';
import type { Feature, FeatureType } from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

/** DTO interno — shape exato que a API retorna (infra concern) */
interface ApiFeatureDto {
    id: number;
    key: string;
    name: string;
    value_isolated: number | null;
    type: string;
    created_at: string;
    updated_at: string;
}

interface ApiFeatureResponseDto {
    data: ApiFeatureDto;
}

interface ApiFeatureListResponseDto {
    data: {
        data: ApiFeatureDto[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

/** Mapper: API DTO → Domain Entity */
function toFeature(raw: ApiFeatureDto): Feature {
    return {
        id: raw.id,
        key: raw.key,
        name: raw.name,
        valueIsolated:
            raw.value_isolated != null ? Number(raw.value_isolated) : null,
        type: raw.type as FeatureType,
    };
}

/** Mapper: Domain Write DTO → API payload (camelCase → snake_case) */
function toApiPayload(dto: FeatureWriteDto): Record<string, unknown> {
    return {
        key: dto.key,
        name: dto.name,
        value_isolated: dto.valueIsolated,
        type: dto.type,
    };
}

export const apiFeaturesRepository: FeaturesRepository = {
    async getCreateOptions(): Promise<FeatureCreateOptions> {
        const { data } = await apiClient.get<{ data: FeatureCreateOptions }>(
            '/admin/features/create-options',
        );
        return (
            data?.data ?? { allowed_keys: {}, available_keys: {}, types: {} }
        );
    },

    async list(params = {}) {
        const { data } = await apiClient.get<ApiFeatureListResponseDto>(
            '/admin/features',
            {
                params: {
                    per_page: params.per_page ?? 500,
                    page: params.page ?? 1,
                    search: params.search,
                    type: params.type,
                },
            },
        );
        const items = data?.data?.data ?? [];
        return items.map(toFeature);
    },

    async getById(id) {
        const { data } = await apiClient.get<ApiFeatureResponseDto>(
            `/admin/features/${id}`,
        );
        if (!data?.data) return null;
        return toFeature(data.data);
    },

    async create(payload) {
        const { data } = await apiClient.post<ApiFeatureResponseDto>(
            '/admin/features',
            toApiPayload(payload),
        );
        return toFeature(data.data);
    },

    async update(id, payload) {
        const { data } = await apiClient.put<ApiFeatureResponseDto>(
            `/admin/features/${id}`,
            toApiPayload(payload),
        );
        return toFeature(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/features/${id}`);
    },
};
