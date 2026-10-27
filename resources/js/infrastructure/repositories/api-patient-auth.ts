import type {
    ClinicOption,
    PatientLoginCredentials,
} from '@/domain/patient/auth';
import { apiClient, setStoredAuth } from '@/infrastructure/api/client';

interface ApiClinicOption {
    id: number | string;
    name: string;
    slug: string | null;
}

interface ApiLoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
        id: number | string;
        name: string;
        email: string;
        clinic_id: number | string;
        photo_url?: string | null;
    };
}

function mapClinicOption(api: ApiClinicOption): ClinicOption {
    return {
        id: String(api.id),
        name: api.name,
        slug: api.slug ?? null,
    };
}

export const apiPatientAuthRepository = {
    async findClinics(identifier: string): Promise<ClinicOption[]> {
        const { data } = await apiClient.post<{ data: ApiClinicOption[] }>(
            '/patient/auth/find-clinics',
            { identifier },
        );

        return (data.data ?? []).map(mapClinicOption);
    },

    async login(credentials: PatientLoginCredentials) {
        const { data } = await apiClient.post<ApiLoginResponse>(
            '/patient/auth/login',
            {
                identifier: credentials.identifier,
                password: credentials.password,
                ...(credentials.clinicId
                    ? { clinic_id: Number(credentials.clinicId) }
                    : {}),
                ...(credentials.clinicSlug
                    ? { clinic_slug: credentials.clinicSlug }
                    : {}),
            },
        );

        setStoredAuth(data.access_token, 'patient');

        return {
            accessToken: data.access_token,
            user: {
                id: String(data.user.id),
                name: data.user.name,
                email: data.user.email,
                clinicId: String(data.user.clinic_id),
                photoUrl: data.user.photo_url ?? undefined,
            },
        };
    },
};
