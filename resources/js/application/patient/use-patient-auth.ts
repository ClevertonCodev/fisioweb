import { useMutation } from '@tanstack/react-query';

import { useAuth } from '@/contexts/AuthContext';
import type {
    ClinicOption,
    PatientLoginCredentials,
} from '@/domain/patient/auth';
import { apiPatientAuthRepository } from '@/infrastructure/repositories/api-patient-auth';

export function useFindPatientClinics() {
    return useMutation<ClinicOption[], unknown, string>({
        mutationFn: (identifier: string) =>
            apiPatientAuthRepository.findClinics(identifier),
    });
}

export function usePatientLogin() {
    const { setUser } = useAuth();

    return useMutation({
        mutationFn: (credentials: PatientLoginCredentials) =>
            apiPatientAuthRepository.login(credentials),
        onSuccess: (result) => {
            setUser(
                {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    clinicId: result.user.clinicId,
                    photoUrl: result.user.photoUrl,
                },
                'patient',
            );
        },
    });
}

export function patientLoginErrorMessage(error: unknown): string {
    const status =
        error && typeof error === 'object' && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

    if (status === 429) {
        const message =
            error && typeof error === 'object' && 'response' in error
                ? (error as { response?: { data?: { message?: string } } })
                      .response?.data?.message
                : null;
        return message || 'Muitas tentativas. Aguarde e tente novamente.';
    }

    if (status === 401 || status === 422) {
        return 'Não encontramos essa combinação. Confira seus dados e tente de novo.';
    }

    return 'Não foi possível entrar agora. Verifique sua conexão e tente de novo.';
}
