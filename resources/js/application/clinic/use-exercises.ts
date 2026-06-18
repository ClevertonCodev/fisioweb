import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { apiClinicExercisesRepository } from '@/infrastructure/repositories';

import type { ExerciseListParams } from './ports';

export function useExercises() {
    return useQuery({
        queryKey: ['exercises'],
        queryFn: () => apiClinicExercisesRepository.list(),
    });
}

export function listExercisesPaginated(params?: ExerciseListParams) {
    return apiClinicExercisesRepository.listPaginated(params);
}

export function useInfiniteExercises() {
    return useInfiniteQuery({
        queryKey: ['exercises-infinite'],
        queryFn: ({ pageParam }) =>
            listExercisesPaginated({ page: pageParam as number, perPage: 20 }),
        getNextPageParam: (lastPage) =>
            lastPage.currentPage < lastPage.lastPage
                ? lastPage.currentPage + 1
                : undefined,
        initialPageParam: 1,
        staleTime: Infinity,
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
        },
    });
}
