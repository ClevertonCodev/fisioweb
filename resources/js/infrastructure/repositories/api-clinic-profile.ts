import type {
    ClinicProfileRepository,
    ClinicProfileUpdateDto,
} from '@/application/clinic/ports';
import type { ClinicProfile } from '@/domain/clinic/clinic-profile';
import { apiClient } from '@/infrastructure/api/client';

interface ApiClinicProfile {
    id: number;
    name: string;
    email: string;
    document: string;
    type_person: string;
    status: number;
    slug?: string | null;
    phone?: string | null;
    zip_code?: string | null;
    address?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
    plan_id?: number | null;
    plan?: { id: number; name: string } | null;
}

function toEntity(raw: ApiClinicProfile): ClinicProfile {
    return {
        id: String(raw.id),
        name: raw.name,
        email: raw.email,
        document: raw.document,
        typePerson: raw.type_person === 'juridica' ? 'PJ' : 'PF',
        status: (raw.status ?? 0) as -1 | 0 | 1,
        slug: raw.slug ?? '',
        phone: raw.phone ?? null,
        zipCode: raw.zip_code ?? null,
        address: raw.address ?? null,
        number: raw.number ?? null,
        city: raw.city ?? null,
        state: raw.state ?? null,
        planId: raw.plan_id ?? raw.plan?.id ?? null,
        planName: raw.plan?.name ?? null,
    };
}

function toApiPayload(dto: ClinicProfileUpdateDto): Record<string, unknown> {
    return {
        name: dto.name,
        type_person: dto.typePerson === 'PJ' ? 'juridica' : 'fisica',
        document: dto.document,
        email: dto.email,
        phone: dto.phone ?? null,
        status: dto.status,
        zip_code: dto.zipCode ?? null,
        address: dto.address ?? null,
        number: dto.number ?? null,
        city: dto.city ?? null,
        state: dto.state ?? null,
    };
}

export const apiClinicProfileRepository: ClinicProfileRepository = {
    async get(): Promise<ClinicProfile> {
        const { data } = await apiClient.get<{ data: ApiClinicProfile }>(
            '/clinic/profile',
        );
        return toEntity(data.data);
    },

    async update(dto: ClinicProfileUpdateDto): Promise<ClinicProfile> {
        const { data } = await apiClient.put<{ data: ApiClinicProfile }>(
            '/clinic/profile',
            toApiPayload(dto),
        );
        return toEntity(data.data);
    },
};
