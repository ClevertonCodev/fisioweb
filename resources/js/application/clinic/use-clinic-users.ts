import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ClinicUserUpdateDto, ClinicUserWriteDto } from '@/application/clinic/ports';
import { apiClinicUsersRepository } from '@/infrastructure/repositories/api-clinic-users';

const QUERY_KEY = ['clinic-users'] as const;

export function useClinicUsers() {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => apiClinicUsersRepository.list(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useClinicProfessionals() {
    return useQuery({
        queryKey: [...QUERY_KEY, 'professionals'] as const,
        queryFn: () => apiClinicUsersRepository.listProfessionals(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useClinicUser(id: string) {
    return useQuery({
        queryKey: [...QUERY_KEY, id],
        queryFn: () => apiClinicUsersRepository.getById(id),
        staleTime: 5 * 60 * 1000,
    });
}

export async function listClinicUsers() {
    return apiClinicUsersRepository.list();
}

export async function findClinicUserById(id: string) {
    return apiClinicUsersRepository.getById(id);
}

export function useCreateClinicUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: ClinicUserWriteDto) => apiClinicUsersRepository.create(dto),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Usuário criado com sucesso.');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error?.response?.data?.message ?? 'Erro ao criar usuário.');
        },
    });
}

export function useUpdateClinicUser(id: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: ClinicUserUpdateDto) => apiClinicUsersRepository.update(id, dto),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Usuário atualizado com sucesso.');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error?.response?.data?.message ?? 'Erro ao atualizar usuário.');
        },
    });
}

export function useDeleteClinicUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicUsersRepository.destroy(id),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Usuário removido com sucesso.');
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error?.response?.data?.message ?? 'Erro ao remover usuário.');
        },
    });
}
