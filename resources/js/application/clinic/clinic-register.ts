import { useQuery } from '@tanstack/react-query';

import type {
    ClinicEmailVerificationInput,
    ClinicRegistrationWriteDto,
    ClinicSlugAvailability,
} from '@/application/clinic/ports';
import {
    CLINIC_SLUG_REGEX,
    type ClinicRegisterField,
} from '@/application/clinic/register-schema';
import { apiClinicRegistrationRepository } from '@/infrastructure/repositories/api-clinic-registration';

export function toClinicSlug(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/**
 * Normaliza o endereço enquanto a pessoa digita no campo de slug, preservando
 * um hífen final para permitir digitar a próxima palavra (o hífen final solto
 * é removido no onBlur/envio).
 */
export function formatSlugInput(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+/g, '');
}

/** Medidor visual de força da senha (0 a 4, com o que falta). */
export function clinicPasswordStrength(password: string) {
    const checks = [
        { ok: password.length >= 8, label: '8 caracteres' },
        {
            ok: /[a-z]/.test(password) && /[A-Z]/.test(password),
            label: 'maiúscula e minúscula',
        },
        { ok: /\d/.test(password), label: 'número' },
        { ok: /[^A-Za-z0-9]/.test(password), label: 'símbolo' },
    ];
    const score = checks.filter((c) => c.ok).length;
    return {
        score,
        checks,
        label:
            ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][score] ?? '',
    };
}

export function registerClinic(
    dto: ClinicRegistrationWriteDto,
): Promise<{ clinicId: number; email: string }> {
    return apiClinicRegistrationRepository.register(dto);
}

export function checkClinicSlug(slug: string): Promise<ClinicSlugAvailability> {
    return apiClinicRegistrationRepository.checkSlug(slug);
}

export function verifyClinicEmail(
    input: ClinicEmailVerificationInput,
): Promise<void> {
    return apiClinicRegistrationRepository.verifyEmail(input);
}

export function resendClinicVerification(email: string): Promise<void> {
    return apiClinicRegistrationRepository.resendVerification(email);
}

export function useClinicSlugAvailability(slug: string) {
    const normalized = slug.trim().toLowerCase();
    const isValidSlug =
        normalized.length > 0 && CLINIC_SLUG_REGEX.test(normalized);

    return useQuery({
        queryKey: ['clinic', 'slug-availability', normalized],
        queryFn: () => checkClinicSlug(normalized),
        enabled: isValidSlug,
        staleTime: 15_000,
    });
}

const API_FIELD_MAP: Record<string, ClinicRegisterField> = {
    name: 'name',
    type_person: 'typePerson',
    document: 'document',
    email: 'email',
    phone: 'phone',
    slug: 'slug',
    password: 'password',
    password_confirmation: 'passwordConfirmation',
    terms_accepted: 'termsAccepted',
};

export function extractRegisterFieldErrors(
    err: unknown,
): Partial<Record<ClinicRegisterField, string>> | null {
    if (!err || typeof err !== 'object' || !('response' in err)) {
        return null;
    }

    const response = (
        err as {
            response?: {
                status?: number;
                data?: { errors?: Record<string, unknown> };
            };
        }
    ).response;

    if (response?.status !== 422 || !response.data?.errors) {
        return null;
    }

    const mapped: Partial<Record<ClinicRegisterField, string>> = {};

    for (const [key, rawMessages] of Object.entries(response.data.errors)) {
        const field = API_FIELD_MAP[key];
        if (!field) continue;

        if (Array.isArray(rawMessages) && typeof rawMessages[0] === 'string') {
            mapped[field] = rawMessages[0];
        } else if (typeof rawMessages === 'string') {
            mapped[field] = rawMessages;
        }
    }

    return Object.keys(mapped).length > 0 ? mapped : null;
}

export function slugUnavailableMessage(
    reason: ClinicSlugAvailability['reason'],
): string | undefined {
    switch (reason) {
        case 'taken':
            return 'Este endereço já é de outra clínica.';
        case 'reserved':
            return 'Este endereço é reservado pelo sistema.';
        case 'invalid':
            return 'Use apenas letras minúsculas, números e hífens.';
        default:
            return undefined;
    }
}
