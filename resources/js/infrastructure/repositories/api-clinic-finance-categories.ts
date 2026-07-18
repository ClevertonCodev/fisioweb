import type {
    FinancialCategory,
    FinancialTransactionType,
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

function mapCategory(raw: ApiCategory): FinancialCategory {
    return {
        id: String(raw.id),
        name: raw.name,
        type: raw.type as FinancialCategory['type'],
        origin: raw.origin as FinancialCategory['origin'],
        active: raw.active,
        displayOrder: raw.display_order,
    };
}

export const apiClinicFinanceCategoriesRepository = {
    async list(type?: FinancialTransactionType): Promise<FinancialCategory[]> {
        const { data } = await apiClient.get<{ data: ApiCategory[] }>(
            '/clinic/finances/categories',
            { params: type ? { type } : undefined },
        );
        return data.data.map(mapCategory);
    },

    async create(
        name: string,
        type: FinancialTransactionType,
    ): Promise<FinancialCategory> {
        const { data } = await apiClient.post<{ data: ApiCategory }>(
            '/clinic/finances/categories',
            { name, type },
        );
        return mapCategory(data.data);
    },

    async toggleActive(id: string): Promise<void> {
        await apiClient.post(`/clinic/finances/categories/${id}/toggle-active`);
    },

    async remove(id: string): Promise<void> {
        await apiClient.delete(`/clinic/finances/categories/${id}`);
    },
};
