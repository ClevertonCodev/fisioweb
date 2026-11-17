import {
    keepPreviousData,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { useCallback } from 'react';

import { apiClinicExercisesRepository } from '@/infrastructure/repositories';

import type { ExerciseListParams } from './ports';

export function listExercisesPaginated(params?: ExerciseListParams) {
    return apiClinicExercisesRepository.listPaginated(params);
}

export function useInfiniteExercises(
    params?: Omit<ExerciseListParams, 'page'>,
) {
    return useInfiniteQuery({
        queryKey: params
            ? ['exercises-infinite', params]
            : ['exercises-infinite'],
        queryFn: ({ pageParam }) =>
            listExercisesPaginated({
                ...params,
                page: pageParam as number,
                perPage: params?.perPage ?? 20,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.currentPage < lastPage.lastPage
                ? lastPage.currentPage + 1
                : undefined,
        initialPageParam: 1,
        staleTime: Infinity,
        placeholderData: keepPreviousData,
    });
}

export function useExercise(id: string | undefined) {
    return useQuery({
        queryKey: ['exercises', id],
        queryFn: () =>
            id
                ? apiClinicExercisesRepository.getById(id)
                : Promise.resolve(null),
        enabled: !!id,
    });
}

export function useRefreshExerciseMedia(exerciseId: string | undefined) {
    const queryClient = useQueryClient();

    return useCallback(async () => {
        if (!exerciseId) return null;

        return queryClient.fetchQuery({
            queryKey: ['exercises', exerciseId],
            queryFn: () => apiClinicExercisesRepository.getById(exerciseId),
            staleTime: 0,
        });
    }, [exerciseId, queryClient]);
}

export function useExerciseFilterCategories() {
    return useQuery({
        queryKey: ['exercises', 'filterCategories'],
        queryFn: () => apiClinicExercisesRepository.getFilterCategories(),
    });
}

export function useToggleExerciseFavorite() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicExercisesRepository.toggleFavorite(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exercises'] });
            queryClient.invalidateQueries({ queryKey: ['exercises-infinite'] });
        },
    });
}
