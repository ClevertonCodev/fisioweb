import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ClinicWriteDto } from '@/application/admin/ports';
import type { PersonType } from '@/domain/admin';
import type { ApiErrorResponse } from '@/domain/api';
import { apiClinicsRepository } from '@/infrastructure/repositories';

/** Labels de UI para tipo de pessoa (application concern) */
export const personTypes: { value: PersonType; label: string }[] = [
    { value: 'PF', label: 'Pessoa Física' },
    { value: 'PJ', label: 'Pessoa Jurídica' },
];

/** Labels de UI para status de clínica (application concern) */
export const clinicStatusTypes: { value: number; label: string }[] = [
    { value: 1, label: 'Ativo' },
    { value: 0, label: 'Inativo' },
    { value: -1, label: 'Cancelado' },
];

// ---------------------------------------------------------------------------
// Funções de use-case puras (não-hook) — usáveis em loaders do React Router
// ---------------------------------------------------------------------------

export function listClinics(params?: {
    search?: string;
    plan_id?: number;
    status?: number;
    per_page?: number;
    page?: number;
}) {
    return apiClinicsRepository.list(params);
}

export function findClinicById(id: number) {
    return apiClinicsRepository.getById(id);
}

export function getClinicsPlansOptions() {
    return apiClinicsRepository.getPlansOptions();
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useClinics(params?: {
    search?: string;
    plan_id?: number;
    status?: number;
    per_page?: number;
    page?: number;
}) {
    return useQuery({
        queryKey: ['admin', 'clinics', params],
        queryFn: () => apiClinicsRepository.list(params),
    });
}

export function useClinic(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'clinic', id],
        queryFn: () => (id ? apiClinicsRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function usePlansOptions() {
    return useQuery({
        queryKey: ['admin', 'plansOptions'],
        queryFn: () => apiClinicsRepository.getPlansOptions(),
    });
}

export function useCreateClinic(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: ClinicWriteDto) => apiClinicsRepository.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
            toast.success('Clínica criada com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao criar clínica.');
        },
    });
}

export function useUpdateClinic(clinicId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: Omit<ClinicWriteDto, 'password'>) =>
            apiClinicsRepository.update(clinicId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', clinicId] });
            toast.success('Clínica atualizada com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao atualizar clínica.');
        },
    });
}

export function useLoginAsClinic() {
    return useMutation({
        mutationFn: (id: number) => apiClinicsRepository.loginAs(id),
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao acessar clínica.');
        },
    });
}

export function useCancelClinic(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiClinicsRepository.destroy(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'clinics'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'clinic', id] });
            toast.success('Clínica cancelada com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao cancelar clínica.');
        },
    });
}
