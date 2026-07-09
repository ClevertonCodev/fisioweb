import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiAdminExerciseReviewRepository } from '@/infrastructure/repositories';

export function usePendingExerciseCount() {
    return useQuery({
        queryKey: ['admin', 'exercises', 'pending-count'],
        queryFn: () => apiAdminExerciseReviewRepository.pendingCount(),
    });
}

export function usePendingExercises() {
    return useQuery({
        queryKey: ['admin', 'exercises', 'pending'],
        queryFn: () => apiAdminExerciseReviewRepository.listPending(),
    });
}

export function useReviewExercise() {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({
            queryKey: ['admin', 'exercises', 'pending'],
        });
        queryClient.invalidateQueries({
            queryKey: ['admin', 'exercises', 'pending-count'],
        });
    };

    const approve = useMutation({
        mutationFn: (id: number) =>
            apiAdminExerciseReviewRepository.approve(id),
        onSuccess: invalidate,
    });

    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
            apiAdminExerciseReviewRepository.reject(id, reason),
        onSuccess: invalidate,
    });

    return { approve, reject };
}
