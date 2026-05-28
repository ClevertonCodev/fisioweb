import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { FeatureWriteDto } from '@/application/admin/ports';
import type { FeatureType } from '@/domain/admin';
import type { ApiErrorResponse } from '@/domain/api';
import { apiFeaturesRepository } from '@/infrastructure/repositories';

/** Labels de UI para os tipos de feature (presentation concern, não pertence ao domain) */
export const featureTypes: { value: FeatureType; label: string }[] = [
    { value: 'bool', label: 'Ativa/Inativa' },
    { value: 'int', label: 'Quantidade' },
];

// ---------------------------------------------------------------------------
// Funções de use-case puras (não-hook) — usáveis em loaders do React Router
// ---------------------------------------------------------------------------

export function listFeatures(params?: {
    search?: string;
    type?: string;
    per_page?: number;
    page?: number;
}) {
    return apiFeaturesRepository.list(params);
}

export function findFeatureById(id: number) {
    return apiFeaturesRepository.getById(id);
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

export function useFeatureCreateOptions() {
    return useQuery({
        queryKey: ['admin', 'featureCreateOptions'],
        queryFn: () => apiFeaturesRepository.getCreateOptions(),
    });
}

export function useFeatures(params?: {
    search?: string;
    type?: string;
    per_page?: number;
    page?: number;
}) {
    return useQuery({
        queryKey: ['admin', 'features', params],
        queryFn: () => apiFeaturesRepository.list(params),
    });
}

export function useFeature(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'feature', id],
        queryFn: () => (id ? apiFeaturesRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useCreateFeature(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FeatureWriteDto) => apiFeaturesRepository.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'features'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'featureCreateOptions'] });
            toast.success('Funcionalidade criada com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao criar funcionalidade.');
        },
    });
}

export function useUpdateFeature(featureId: number, options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: FeatureWriteDto) => apiFeaturesRepository.update(featureId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'features'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature', featureId] });
            toast.success('Funcionalidade atualizada com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao atualizar funcionalidade.');
        },
    });
}

export function useDeleteFeature(options?: { onSuccess?: () => void }) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiFeaturesRepository.destroy(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'features'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'feature', id] });
            toast.success('Funcionalidade removida com sucesso.');
            options?.onSuccess?.();
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao excluir funcionalidade.');
        },
    });
}
