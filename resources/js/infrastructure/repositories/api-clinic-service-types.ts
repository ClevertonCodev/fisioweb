import type { ServiceTypesRepository } from '@/application/clinic/ports';
import type { ServiceType, ServiceTypeDraft } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiServiceTypeDto {
    id: number;
    name: string;
    duration_minutes: number;
    position: number;
}

function toEntity(raw: ApiServiceTypeDto): ServiceType {
    return {
        id: String(raw.id),
        name: raw.name,
        durationMinutes: raw.duration_minutes,
        position: raw.position,
    };
}

function toPayload(item: ServiceTypeDraft): Record<string, unknown> {
    return {
        ...(item.id ? { id: Number(item.id) } : {}),
        name: item.name,
        duration_minutes: item.durationMinutes,
    };
}

export const apiClinicServiceTypesRepository: ServiceTypesRepository = {
    async list(): Promise<ServiceType[]> {
        const { data } = await apiClient.get<{ data: ApiServiceTypeDto[] }>(
            '/clinic/service-types',
        );
        return data.data.map(toEntity);
    },

    async replace(items: ServiceTypeDraft[]): Promise<ServiceType[]> {
        const { data } = await apiClient.put<{ data: ApiServiceTypeDto[] }>(
            '/clinic/service-types',
            { items: items.map(toPayload) },
        );
        return data.data.map(toEntity);
    },
};
