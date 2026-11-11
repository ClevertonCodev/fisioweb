import {
    type QueryClient,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import type { MediaProposalDecision } from '@/domain/admin';
import type { ApiErrorResponse } from '@/domain/api';
import { apiAdminExerciseReviewRepository } from '@/infrastructure/repositories';

const pendingKey = ['admin', 'exercises', 'pending'];
const pendingCountKey = ['admin', 'exercises', 'pending-count'];
const mediaProposalsKey = ['admin', 'exercises', 'media-proposals'];

function invalidateReviewQueries(queryClient: QueryClient) {
    for (const queryKey of [pendingKey, pendingCountKey, mediaProposalsKey]) {
        queryClient.invalidateQueries({ queryKey });
    }
}

function reviewErrorHandler(queryClient: QueryClient, fallback: string) {
    return (err: ApiErrorResponse) => {
        toast.error(err?.response?.data?.message ?? fallback);
        invalidateReviewQueries(queryClient);
    };
}

export function usePendingExerciseCount() {
    return useQuery({
        queryKey: pendingCountKey,
        queryFn: () => apiAdminExerciseReviewRepository.pendingCount(),
    });
}

export function usePendingExercises() {
    return useQuery({
        queryKey: pendingKey,
        queryFn: () => apiAdminExerciseReviewRepository.listPending(),
    });
}

export function useMediaProposals() {
    return useQuery({
        queryKey: mediaProposalsKey,
        queryFn: () => apiAdminExerciseReviewRepository.listMediaProposals(),
    });
}

export function useReviewExercise() {
    const queryClient = useQueryClient();
    const invalidate = () => invalidateReviewQueries(queryClient);

    const approve = useMutation({
        mutationFn: (id: number) =>
            apiAdminExerciseReviewRepository.approve(id),
        onSuccess: invalidate,
        onError: reviewErrorHandler(
            queryClient,
            'Não foi possível aprovar o exercício.',
        ),
    });

    const reject = useMutation({
        mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
            apiAdminExerciseReviewRepository.reject(id, reason),
        onSuccess: invalidate,
        onError: reviewErrorHandler(
            queryClient,
            'Não foi possível rejeitar o exercício.',
        ),
    });

    return { approve, reject };
}

export function useReviewMediaProposal() {
    const queryClient = useQueryClient();

    const approve = useMutation({
        mutationFn: (decision: MediaProposalDecision) =>
            apiAdminExerciseReviewRepository.approveMediaProposal(decision),
        onSuccess: () => {
            toast.success('Mídia aprovada. Todas as clínicas já veem a nova.');
            invalidateReviewQueries(queryClient);
        },
        onError: reviewErrorHandler(
            queryClient,
            'Não foi possível aprovar a mídia.',
        ),
    });

    const reject = useMutation({
        mutationFn: (decision: MediaProposalDecision) =>
            apiAdminExerciseReviewRepository.rejectMediaProposal(decision),
        onSuccess: () => {
            toast.success('Proposta rejeitada. A mídia atual continua.');
            invalidateReviewQueries(queryClient);
        },
        onError: reviewErrorHandler(
            queryClient,
            'Não foi possível rejeitar a mídia.',
        ),
    });

    return { approve, reject };
}
