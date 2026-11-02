import type {
    ClinicEmailVerificationInput,
    ClinicRegistrationRepository,
    ClinicRegistrationWriteDto,
    ClinicSlugAvailability,
} from '@/application/clinic/ports';
import { apiClient } from '@/infrastructure/api/client';

interface ApiClinicRegistrationResponse {
    clinic_id: number;
    email: string;
}

interface ApiSlugAvailabilityResponse {
    available: boolean;
    reason: 'taken' | 'reserved' | 'invalid' | null;
}

function toApiRegisterPayload(
    dto: ClinicRegistrationWriteDto,
): Record<string, unknown> {
    const phoneDigits = (dto.phone ?? '').replace(/\D/g, '');

    return {
        name: dto.name.trim(),
        type_person: dto.typePerson === 'PF' ? 'fisica' : 'juridica',
        document: dto.document.replace(/\D/g, ''),
        email: dto.email.trim().toLowerCase(),
        phone: phoneDigits ? phoneDigits : null,
        slug: dto.slug.trim().toLowerCase(),
        password: dto.password,
        password_confirmation: dto.passwordConfirmation,
        terms_accepted: dto.termsAccepted,
    };
}

export const apiClinicRegistrationRepository: ClinicRegistrationRepository = {
    async register(dto: ClinicRegistrationWriteDto) {
        const { data } = await apiClient.post<{
            data: ApiClinicRegistrationResponse;
        }>('/clinic/auth/register', toApiRegisterPayload(dto));

        return {
            clinicId: data.data.clinic_id,
            email: data.data.email,
        };
    },

    async checkSlug(slug: string): Promise<ClinicSlugAvailability> {
        const { data } = await apiClient.get<{
            data: ApiSlugAvailabilityResponse;
        }>('/clinic/auth/slug-availability', {
            params: { slug: slug.trim().toLowerCase() },
        });

        return {
            available: Boolean(data.data.available),
            reason: data.data.reason ?? null,
        };
    },

    async verifyEmail(input: ClinicEmailVerificationInput): Promise<void> {
        await apiClient.post('/clinic/auth/verify-email', {
            id: input.id,
            hash: input.hash,
            expires: input.expires,
            signature: input.signature,
        });
    },

    async resendVerification(email: string): Promise<void> {
        await apiClient.post('/clinic/auth/verify-email/resend', {
            email: email.trim().toLowerCase(),
        });
    },
};
