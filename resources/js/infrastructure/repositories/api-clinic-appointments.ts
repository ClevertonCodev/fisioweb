import type {
    AppointmentListParams,
    AppointmentsRepository,
    AppointmentWriteDto,
} from '@/application/clinic/ports';
import type { Appointment } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiNamedDto {
    id: number;
    name: string;
}

interface ApiAppointmentDto {
    id: number;
    patient_id: number | null;
    clinic_user_id: number;
    title: string | null;
    description: string | null;
    location: string | null;
    starts_at: string;
    ends_at: string;
    status: Appointment['status'];
    patient?: ApiNamedDto | null;
    clinic_user?: ApiNamedDto | null;
}

function toEntity(raw: ApiAppointmentDto): Appointment {
    return {
        id: String(raw.id),
        patientId: raw.patient_id !== null ? String(raw.patient_id) : '',
        patientName: raw.patient?.name ?? '',
        clinicUserId: String(raw.clinic_user_id),
        clinicUserName: raw.clinic_user?.name ?? '',
        title: raw.title,
        description: raw.description,
        startsAt: raw.starts_at,
        endsAt: raw.ends_at,
        status: raw.status,
        location: raw.location,
    };
}

function toPayload(dto: AppointmentWriteDto): Record<string, unknown> {
    return {
        patient_id: Number(dto.patientId),
        clinic_user_id: Number(dto.clinicUserId),
        title: dto.title ?? null,
        description: dto.description ?? null,
        location: dto.location ?? null,
        starts_at: dto.startsAt,
        ends_at: dto.endsAt,
    };
}

export const apiClinicAppointmentsRepository: AppointmentsRepository = {
    async list(params: AppointmentListParams = {}): Promise<Appointment[]> {
        const query: Record<string, string> = {};
        if (params.from) query.from = params.from;
        if (params.to) query.to = params.to;
        if (params.clinicUserId) query.clinic_user_id = params.clinicUserId;
        if (params.status) query.status = params.status;

        const { data } = await apiClient.get<{ data: ApiAppointmentDto[] }>(
            '/clinic/appointments',
            { params: query },
        );
        return data.data.map(toEntity);
    },

    async getClinicUsers(): Promise<{ id: string; name: string }[]> {
        const { data } = await apiClient.get<{ data: ApiNamedDto[] }>(
            '/clinic/users/professionals',
        );
        return data.data.map((u) => ({ id: String(u.id), name: u.name }));
    },

    async getAgendaPatients(): Promise<{ id: string; name: string }[]> {
        const { data } = await apiClient.get<{
            data: { data: { id: number; name: string }[] };
        }>('/clinic/patients', { params: { per_page: 200, is_active: true } });
        const items = Array.isArray(data?.data?.data) ? data.data.data : [];
        return items.map((p) => ({ id: String(p.id), name: p.name }));
    },

    async create(dto: AppointmentWriteDto): Promise<Appointment> {
        const { data } = await apiClient.post<{ data: ApiAppointmentDto }>(
            '/clinic/appointments',
            toPayload(dto),
        );
        return toEntity(data.data);
    },

    async update(id: string, dto: AppointmentWriteDto): Promise<Appointment> {
        const { data } = await apiClient.put<{ data: ApiAppointmentDto }>(
            `/clinic/appointments/${id}`,
            toPayload(dto),
        );
        return toEntity(data.data);
    },

    async updateStatus(
        id: string,
        status: Appointment['status'],
    ): Promise<Appointment> {
        const { data } = await apiClient.patch<{ data: ApiAppointmentDto }>(
            `/clinic/appointments/${id}/status`,
            { status },
        );
        return toEntity(data.data);
    },

    async cancel(id: string): Promise<Appointment> {
        const { data } = await apiClient.post<{ data: ApiAppointmentDto }>(
            `/clinic/appointments/${id}/cancel`,
        );
        return toEntity(data.data);
    },
};
