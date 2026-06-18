import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    FeaturePlanWriteDto,
    PlanWriteDto,
} from '@/application/admin/ports';
import type { BillingType } from '@/domain/admin';
import type { ApiErrorResponse } from '@/domain/api';
import { apiPlansRepository } from '@/infrastructure/repositories';

/** Labels de UI para tipo de cobrança (application concern) */
export const billingTypes: { value: BillingType; label: string }[] = [
    { value: 'fixed', label: 'Fixo' },
    { value: 'per_user', label: 'Usuário' },
];

// ---------------------------------------------------------------------------
// Funções de use-case puras (não-hook) — usáveis em loaders do React Router
// ---------------------------------------------------------------------------

export function listPlans(params?: {
    search?: string;
    per_page?: number;
    page?: number;
}) {
    return apiPlansRepository.list(params);
}

export function findPlanById(id: number) {
    return apiPlansRepository.getById(id);
}

export function listFeaturePlans(params?: { plan_id?: number }) {
    return apiPlansRepository.getFeaturePlans(params);
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function usePlans(params?: {
    search?: string;
    per_page?: number;
    page?: number;
}) {
    return useQuery({
        queryKey: ['admin', 'plans', params],
        queryFn: () => apiPlansRepository.list(params),
    });
}

export function usePlan(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'plan', id],
        queryFn: () =>
            id ? apiPlansRepository.getById(id) : Promise.resolve(null),
        enabled: !!id,
    });
}

export function useFeaturePlans(params?: { plan_id?: number }) {
    return useQuery({
        queryKey: ['admin', 'featurePlans', params],
        queryFn: () => apiPlansRepository.getFeaturePlans(params),
    });
}

export function useCreatePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlanWriteDto) =>
            apiPlansRepository.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            toast.success('Plano criado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao criar plano.');
        },
    });
}

export function useUpdatePlan(
    planId: number,
    options?: { onSuccess?: () => void },
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: PlanWriteDto) =>
            apiPlansRepository.update(planId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            queryClient.invalidateQueries({
                queryKey: ['admin', 'plan', planId],
            });
            toast.success('Plano atualizado com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ?? 'Erro ao atualizar plano.',
            );
        },
    });
}

export function useDeletePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiPlansRepository.destroy(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'plans'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'plan', id] });
            toast.success('Plano removido com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ?? 'Erro ao excluir plano.',
            );
        },
    });
}

export function useCreateFeaturePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FeaturePlanWriteDto) =>
            apiPlansRepository.createFeaturePlan(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'featurePlans'],
            });
            toast.success('Funcionalidade vinculada ao plano.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ??
                    'Erro ao vincular funcionalidade ao plano.',
            );
        },
    });
}

export function useDeleteFeaturePlan(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiPlansRepository.destroyFeaturePlan(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['admin', 'featurePlans'],
            });
            toast.success('Configuração removida com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ?? 'Erro ao remover configuração.',
            );
        },
    });
}
