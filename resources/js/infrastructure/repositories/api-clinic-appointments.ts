import { isAxiosError } from 'axios';

import type {
    AgendaProfessional,
    AppointmentListParams,
    AppointmentsRepository,
    AppointmentWriteDto,
    PatientAppointmentHistoryPage,
} from '@/application/clinic/ports';
import type {
    Appointment,
    PatientAppointmentHistoryItem,
} from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiNamedDto {
    id: number;
    name: string;
}

interface ApiProfessionalDto {
    id: number;
    name: string;
    photo_url?: string | null;
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
    source?: Appointment['source'] | null;
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
        source: raw.source === 'google' ? 'google' : 'system',
    };
}

interface ApiPatientHistoryDto {
    id: number;
    starts_at: string;
    ends_at: string;
    title: string | null;
    clinic_user_name: string | null;
    status: Appointment['status'];
}

function toHistoryItem(
    raw: ApiPatientHistoryDto,
): PatientAppointmentHistoryItem {
    return {
        id: String(raw.id),
        startsAt: raw.starts_at,
        endsAt: raw.ends_at,
        title: raw.title,
        clinicUserName: raw.clinic_user_name ?? '',
        status: raw.status,
    };
}

function toPayload(dto: AppointmentWriteDto): Record<string, unknown> {
    const payload: Record<string, unknown> = {
        clinic_user_id: Number(dto.clinicUserId),
        title: dto.title ?? null,
        description: dto.description ?? null,
        location: dto.location ?? null,
        starts_at: dto.startsAt,
        ends_at: dto.endsAt,
    };

    if (dto.patientId) {
        payload.patient_id = Number(dto.patientId);
    }

    return payload;
}

export const apiClinicAppointmentsRepository: AppointmentsRepository = {
    async list(params: AppointmentListParams = {}): Promise<Appointment[]> {
        const query: Record<string, string> = {};
        if (params.from) query.from = params.from;
        if (params.to) query.to = params.to;
        if (params.clinicUserId) query.clinic_user_id = params.clinicUserId;
        if (params.status) query.status = params.status;
        if (params.patientId) query.patient_id = params.patientId;

        const { data } = await apiClient.get<{ data: ApiAppointmentDto[] }>(
            '/clinic/appointments',
            { params: query },
        );
        return data.data.map(toEntity);
    },

    async getClinicUsers(): Promise<AgendaProfessional[]> {
        const { data } = await apiClient.get<{ data: ApiProfessionalDto[] }>(
            '/clinic/users/professionals',
        );
        return data.data.map((u) => ({
            id: String(u.id),
            name: u.name,
            photoUrl: u.photo_url ?? undefined,
        }));
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

    async patientHistory(
        patientId: string,
        page: number,
    ): Promise<PatientAppointmentHistoryPage | null> {
        try {
            const { data } = await apiClient.get<{
                data: {
                    data: ApiPatientHistoryDto[];
                    total: number;
                    per_page: number;
                    current_page: number;
                    last_page: number;
                };
            }>(`/clinic/patients/${patientId}/appointments`, {
                params: { page },
            });
            return {
                items: data.data.data.map(toHistoryItem),
                total: data.data.total,
                perPage: data.data.per_page,
                currentPage: data.data.current_page,
                lastPage: data.data.last_page,
            };
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    },
};
