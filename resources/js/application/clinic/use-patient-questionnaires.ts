import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { PatientQuestionnaireWriteDto } from '@/application/clinic/ports';
import type { ApiErrorResponse } from '@/domain/api';
import { apiClinicPatientQuestionnairesRepository } from '@/infrastructure/repositories/api-clinic-patient-questionnaires';

const repo = apiClinicPatientQuestionnairesRepository;

const keys = {
    patientQuestionnaires: (patientId: string) => ['patient-questionnaires', 'patient', patientId] as const,
    patientQuestionnaire: (patientId: string, questionnaireId: string) =>
        ['patient-questionnaires', 'patient', patientId, questionnaireId] as const,
};

export function usePatientQuestionnaire(patientId: string, questionnaireId: string | null) {
    return useQuery({
        queryKey: keys.patientQuestionnaire(patientId, questionnaireId ?? ''),
        queryFn: () => repo.findById(patientId, questionnaireId!),
        enabled: !!patientId && !!questionnaireId,
    });
}

export function usePatientQuestionnaires(patientId: string) {
    return useQuery({
        queryKey: keys.patientQuestionnaires(patientId),
        queryFn: () => repo.listByPatient(patientId),
        enabled: !!patientId,
    });
}

export function useSendQuestionnaire(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: PatientQuestionnaireWriteDto) => repo.store(patientId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.patientQuestionnaires(patientId) });
            toast.success('Questionário enviado com sucesso');
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao enviar questionário');
        },
    });
}

export function useDeleteQuestionnaire(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (questionnaireId: string) => repo.destroy(patientId, questionnaireId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.patientQuestionnaires(patientId) });
            toast.success('Questionário excluído com sucesso');
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(err?.response?.data?.message ?? 'Erro ao excluir questionário');
        },
    });
}
