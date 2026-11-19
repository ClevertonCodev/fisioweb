import { useMutation, useQuery } from '@tanstack/react-query';

import type { PublicQuestionnaireAnswerWriteDto } from '@/application/patient/ports';
import { apiPublicQuestionnairesRepository } from '@/infrastructure/repositories/api-public-questionnaires';

const repo = apiPublicQuestionnairesRepository;

export function usePublicQuestionnaire(token: string) {
    return useQuery({
        queryKey: ['patient', 'public-questionnaire', token],
        queryFn: () => repo.findByToken(token),
        enabled: !!token,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });
}

export function useSubmitPublicQuestionnaire(token: string) {
    return useMutation({
        mutationFn: (answers: PublicQuestionnaireAnswerWriteDto[]) =>
            repo.submitAnswers(token, answers),
    });
}
