import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiAdminExercisesRepository } from '@/infrastructure/repositories';
interface ListParams {
    search?: string;
    physio_area_id?: number;
    physio_subarea_id?: number;
    body_region_id?: number;
    difficulty_level?: string;
    movement_form?: string;
    is_active?: boolean;
    per_page?: number;
    page?: number;
}

export function useAdminExercises(params?: ListParams) {
    return useQuery({
        queryKey: ['admin', 'exercises', params],
        queryFn: () => apiAdminExercisesRepository.list(params),
    });
}

export function useAdminExercise(id: number | undefined) {
    return useQuery({
        queryKey: ['admin', 'exercise', id],
        queryFn: () => (id ? apiAdminExercisesRepository.getById(id) : Promise.resolve(null)),
        enabled: !!id,
    });
}

export function useAdminExerciseOptions() {
    return useQuery({
        queryKey: ['admin', 'exerciseOptions'],
        queryFn: () => apiAdminExercisesRepository.getOptions(),
    });
}

export function useCreateAdminExercise() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => apiAdminExercisesRepository.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] });
        },
    });
}

export function useUpdateAdminExercise(id: number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => apiAdminExercisesRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'exercise', id] });
        },
    });
}

export function useDeleteAdminExercise() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiAdminExercisesRepository.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'exercises'] });
        },
    });
}
