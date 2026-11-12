import type {
    PatientFilesRepository,
    PatientFileStoreOptions,
} from '@/application/clinic/ports';
import type {
    PatientFile,
    PatientFileLink,
    PatientFilePreview,
} from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiPatientFileDto {
    id: number;
    patient_id: number;
    clinic_user_id: number;
    clinic_user?: { id: number; name: string };
    original_name: string;
    name?: string;
    mime_type: string;
    size: number;
    created_at: string;
}

function toPatientFile(raw: ApiPatientFileDto): PatientFile {
    return {
        id: raw.id,
        patientId: raw.patient_id,
        clinicUserId: raw.clinic_user_id,
        clinicUser: raw.clinic_user,
        originalName: raw.original_name,
        name: raw.name,
        mimeType: raw.mime_type,
        size: raw.size,
        createdAt: raw.created_at,
    };
}

export const apiClinicPatientFilesRepository: PatientFilesRepository = {
    async listByPatient(patientId) {
        const res = await apiClient.get<{ data: ApiPatientFileDto[] }>(
            `/clinic/patients/${patientId}/files`,
        );
        return res.data.data.map(toPatientFile);
    },
    async store(patientId, file, options?: PatientFileStoreOptions) {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.name) formData.append('name', options.name);
        const res = await apiClient.post<{ data: ApiPatientFileDto }>(
            `/clinic/patients/${patientId}/files`,
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const total = e.total;
                    if (total && options?.onUploadProgress) {
                        options.onUploadProgress(
                            Math.round((e.loaded * 100) / total),
                        );
                    }
                },
            },
        );
        return toPatientFile(res.data.data);
    },
    async destroy(patientId, fileId) {
        await apiClient.delete(`/clinic/patients/${patientId}/files/${fileId}`);
    },
    async getUrl(patientId, fileId): Promise<PatientFileLink> {
        const res = await apiClient.get<{
            data: { url: string; expires_at: string };
        }>(`/clinic/patients/${patientId}/files/${fileId}/url`);
        return { url: res.data.data.url, expiresAt: res.data.data.expires_at };
    },

    async listPreviews(patientId): Promise<PatientFilePreview[]> {
        const res = await apiClient.get<{
            data: { file_id: number; url: string; expires_at: string }[];
        }>(`/clinic/patients/${patientId}/files/previews`);
        return res.data.data.map((p) => ({
            fileId: p.file_id,
            url: p.url,
            expiresAt: p.expires_at,
        }));
    },
};
