import type {
    PatientListParams,
    PatientListResult,
    PatientUpdateDto,
    PatientWriteDto,
    PatientsRepository,
} from '@/application/clinic/ports';
import type { Patient, PatientDetail, PatientStatus } from '@/domain/clinic/patient';
import { apiClient } from '@/infrastructure/api/client';

interface ApiPatientDto {
    id: number;
    name: string;
    status?: string;
    photo_url?: string;
    cpf?: string;
    is_foreign?: boolean;
    apelido?: string;
    use_apelido?: boolean;
    birth_date?: string;
    marital_status?: string;
    profession?: string;
    biological_sex?: string;
    gender?: string;
    education?: string;
    phone?: string;
    email?: string;
    zip_code?: string;
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    insurance?: string;
    insurance_number?: string;
    referral_source?: string;
}

interface ApiPatientPage {
    data: ApiPatientDto[];
    total: number;
    last_page: number;
    per_page: number;
    current_page: number;
}

function toEntity(raw: ApiPatientDto): Patient {
    return {
        id: String(raw.id),
        name: raw.name,
        initial: raw.name.charAt(0).toUpperCase(),
        professional: '',
        professionalInitial: '',
        status: (raw.status as PatientStatus) ?? 'em_tratamento',
        diagnosis: '',
        photoUrl: raw.photo_url ?? undefined,
    };
}

function toDetailEntity(raw: ApiPatientDto): PatientDetail {
    return {
        ...toEntity(raw),
        cpf: raw.cpf ?? undefined,
        isForeign: raw.is_foreign ?? false,
        apelido: raw.apelido ?? undefined,
        useApelido: raw.use_apelido ?? false,
        birthDate: raw.birth_date ?? undefined,
        maritalStatus: raw.marital_status ?? undefined,
        profession: raw.profession ?? undefined,
        biologicalSex: raw.biological_sex ?? undefined,
        gender: raw.gender ?? undefined,
        education: raw.education ?? undefined,
        phone: raw.phone ?? undefined,
        email: raw.email ?? undefined,
        zipCode: raw.zip_code ?? undefined,
        address: raw.address ?? undefined,
        neighborhood: raw.neighborhood ?? undefined,
        city: raw.city ?? undefined,
        state: raw.state ?? undefined,
        insurance: raw.insurance ?? undefined,
        insuranceNumber: raw.insurance_number ?? undefined,
        referralSource: raw.referral_source ?? undefined,
    };
}

function toApiUpdatePayload(dto: PatientUpdateDto): Record<string, unknown> {
    return {
        name: dto.name,
        phone: dto.phone,
        birth_date: dto.birthDate,
        email: dto.email,
        is_foreign: dto.isForeign,
        cpf: dto.cpf,
        apelido: dto.apelido,
        use_apelido: dto.useApelido,
        marital_status: dto.maritalStatus,
        profession: dto.profession,
        biological_sex: dto.biologicalSex,
        gender: dto.gender,
        education: dto.education,
        status: dto.status,
        address: dto.address,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        zip_code: dto.zipCode,
        insurance: dto.insurance,
        insurance_number: dto.insuranceNumber,
        referral_source: dto.referralSource,
        is_active: dto.isActive,
    };
}

function toApiPayload(dto: PatientWriteDto): Record<string, unknown> {
    return {
        name: dto.name,
        phone: dto.phone,
        birth_date: dto.birthDate,
        email: dto.email,
        password: dto.password,
        is_foreign: dto.isForeign,
        cpf: dto.cpf,
        apelido: dto.apelido,
        use_apelido: dto.useApelido,
        marital_status: dto.maritalStatus,
        profession: dto.profession,
        biological_sex: dto.biologicalSex,
        gender: dto.gender,
        education: dto.education,
        status: dto.status,
        address: dto.address,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        zip_code: dto.zipCode,
        insurance: dto.insurance,
        insurance_number: dto.insuranceNumber,
        referral_source: dto.referralSource,
        is_active: dto.isActive,
    };
}

export const apiClinicPatientsRepository: PatientsRepository = {
    async list(params: PatientListParams = {}): Promise<PatientListResult> {
        const res = await apiClient.get<{ data: ApiPatientPage }>('/clinic/patients', {
            params: {
                page: params.page,
                per_page: params.perPage,
                search: params.search || undefined,
                is_active: params.isActive,
                statuses: params.statuses?.join(',') || undefined,
                professional_ids: params.professionalIds?.join(',') || undefined,
                date_from: params.dateFrom || undefined,
                date_to: params.dateTo || undefined,
            },
        });
        const page = res.data.data;
        return {
            data: page.data.map(toEntity),
            total: page.total,
            lastPage: page.last_page,
            perPage: page.per_page,
            currentPage: page.current_page,
        };
    },

    async getById(id: string) {
        const res = await apiClient.get<{ data: ApiPatientDto }>(`/clinic/patients/${id}`);
        return toEntity(res.data.data);
    },

    async getDetailById(id: string) {
        const res = await apiClient.get<{ data: ApiPatientDto }>(`/clinic/patients/${id}`);
        return toDetailEntity(res.data.data);
    },

    async update(id: string, dto: PatientUpdateDto) {
        const res = await apiClient.put<{ data: ApiPatientDto }>(
            `/clinic/patients/${id}`,
            toApiUpdatePayload(dto),
        );
        return toEntity(res.data.data);
    },

    async create(dto: PatientWriteDto) {
        const res = await apiClient.post<{ data: ApiPatientDto }>(
            '/clinic/patients',
            toApiPayload(dto),
        );
        return toEntity(res.data.data);
    },

    async bulkInactivate(ids: string[]) {
        await apiClient.post('/clinic/patients/bulk-inactivate', {
            ids: ids.map(Number),
        });
    },

    async uploadPhoto(id: string, file: File) {
        const form = new FormData();
        form.append('photo', file);
        const res = await apiClient.post<{ data: ApiPatientDto }>(
            `/clinic/patients/${id}/photo`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return toEntity(res.data.data);
    },
};
