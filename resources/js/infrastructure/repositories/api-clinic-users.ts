import type {
    ClinicUserUpdateDto,
    ClinicUserWriteDto,
    ClinicUsersRepository,
} from '@/application/clinic/ports';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { apiClient } from '@/infrastructure/api/client';

interface ApiClinicUser {
    id: number;
    name: string;
    email: string;
    role: string;
    mestre: number;
    status: number;
    document?: string;
    photo_url?: string | null;
}

function toEntity(raw: ApiClinicUser): ClinicUserSummary {
    return {
        id: String(raw.id),
        name: raw.name,
        email: raw.email,
        role: raw.role as ClinicRole,
        mestre: raw.mestre === 1 ? 1 : 0,
        status: raw.status,
        document: raw.document,
        photoUrl: raw.photo_url ?? undefined,
    };
}

function toApiPayload(
    dto: ClinicUserWriteDto | ClinicUserUpdateDto,
): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    if ('name' in dto && dto.name !== undefined) payload.name = dto.name;
    if ('email' in dto && dto.email !== undefined) payload.email = dto.email;
    if ('password' in dto && dto.password !== undefined)
        payload.password = dto.password;
    if ('role' in dto && dto.role !== undefined) payload.role = dto.role;
    if ('document' in dto && dto.document !== undefined)
        payload.document = dto.document;
    if ('status' in dto && dto.status !== undefined)
        payload.status = dto.status;
    return payload;
}

export const apiClinicUsersRepository: ClinicUsersRepository = {
    /**
     * GET `/clinic/users` — hoje retorna a lista completa da clínica.
     *
     * Contrato futuro recomendado (paginação e filtros no servidor): query opcionais
     * `search` (nome/e-mail), `role` (`admin`|`secretary`|`physiotherapist`), `status`
     * (`0`|`1`), `page` ≥ 1, `per_page` (ex.: 10). Resposta:
     * `{ data: ApiClinicUser[], meta?: { current_page, last_page, per_page, total } }`.
     */
    async list(): Promise<ClinicUserSummary[]> {
        const { data } = await apiClient.get<{ data: ApiClinicUser[] }>(
            '/clinic/users',
        );
        const items = Array.isArray(data?.data) ? data.data : [];
        return items.map(toEntity);
    },

    async listProfessionals(): Promise<{ id: string; name: string }[]> {
        const { data } = await apiClient.get<{
            data: Array<{ id: number; name: string }>;
        }>('/clinic/users/professionals');
        const items = Array.isArray(data?.data) ? data.data : [];
        return items.map((item) => ({ id: String(item.id), name: item.name }));
    },

    async getById(id: string): Promise<ClinicUserSummary> {
        const { data } = await apiClient.get<{ data: ApiClinicUser }>(
            `/clinic/users/${id}`,
        );
        return toEntity(data.data);
    },

    async create(dto: ClinicUserWriteDto): Promise<ClinicUserSummary> {
        const { data } = await apiClient.post<{ data: ApiClinicUser }>(
            '/clinic/users',
            toApiPayload(dto),
        );
        return toEntity(data.data);
    },

    async update(
        id: string,
        dto: ClinicUserUpdateDto,
    ): Promise<ClinicUserSummary> {
        const { data } = await apiClient.put<{ data: ApiClinicUser }>(
            `/clinic/users/${id}`,
            toApiPayload(dto),
        );
        return toEntity(data.data);
    },

    async uploadPhoto(id: string, file: File): Promise<ClinicUserSummary> {
        const form = new FormData();
        form.append('photo', file);
        const { data } = await apiClient.post<{ data: ApiClinicUser }>(
            `/clinic/users/${id}/photo`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return toEntity(data.data);
    },

    async destroy(id: string): Promise<void> {
        await apiClient.delete(`/clinic/users/${id}`);
    },
};
