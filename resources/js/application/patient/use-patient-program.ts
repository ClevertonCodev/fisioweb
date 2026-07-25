import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    completePatientProgram,
    getPatientProgramByPublicToken,
    listPatientPrograms,
    registerPatientProgramView,
    savePatientProgramSeries,
    startOrResumePatientProgramExecution,
    submitPatientProgramFeedback,
    updateUnfinishedExercises,
} from '@/infrastructure/repositories/api-patient-programs';

export function usePatientPrograms() {
    return useQuery({
        queryKey: ['patient', 'programs'],
        queryFn: listPatientPrograms,
    });
}

export function usePatientProgram(publicToken: string) {
    return useQuery({
        queryKey: ['patient', 'program', publicToken],
        queryFn: () => getPatientProgramByPublicToken(publicToken),
        enabled: !!publicToken,
    });
}

export function useRegisterProgramView() {
    return useMutation({
        mutationFn: async (publicToken: string) => {
            // Público: token do programa basta para marcar "Visualizado" na clínica
            try {
                await registerPatientProgramView(publicToken);
            } catch {
                // Não bloqueia UX do detalhe (SC-005)
            }
        },
    });
}

export function useStartOrResumeExecution() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (publicToken: string) =>
            startOrResumePatientProgramExecution(publicToken),
        onSuccess: (_data, publicToken) => {
            void queryClient.invalidateQueries({
                queryKey: ['patient', 'program', publicToken],
            });
        },
    });
}

export function useSaveProgramSeries() {
    return useMutation({
        mutationFn: savePatientProgramSeries,
    });
}

export function useUpdateUnfinishedExercises() {
    return useMutation({
        mutationFn: updateUnfinishedExercises,
    });
}

export function useSubmitProgramFeedback() {
    return useMutation({
        mutationFn: submitPatientProgramFeedback,
    });
}

export function useCompleteProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (publicToken: string) => completePatientProgram(publicToken),
        onSuccess: (_data, publicToken) => {
            void queryClient.invalidateQueries({
                queryKey: ['patient', 'programs'],
            });
            void queryClient.invalidateQueries({
                queryKey: ['patient', 'program', publicToken],
            });
        },
    });
}
