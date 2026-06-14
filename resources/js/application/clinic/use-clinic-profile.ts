import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ClinicProfileUpdateDto } from '@/application/clinic/ports';
import { apiClinicProfileRepository } from '@/infrastructure/repositories/api-clinic-profile';

const QUERY_KEY = ['clinic', 'profile'] as const;

export function useClinicProfile() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => apiClinicProfileRepository.get(),
        staleTime: 5 * 60 * 1000,
    });
}

export async function getClinicProfile() {
    return apiClinicProfileRepository.get();
}

export function useUpdateClinicProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (dto: ClinicProfileUpdateDto) =>
            apiClinicProfileRepository.update(dto),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Dados da clínica atualizados com sucesso.');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(
                error?.response?.data?.message ??
                    'Erro ao atualizar dados da clínica.',
            );
        },
    });
}
