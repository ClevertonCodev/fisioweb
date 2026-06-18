import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { QuestionnaireTemplateWriteDto } from '@/application/clinic/ports';
import { apiClinicQuestionnaireTemplatesRepository } from '@/infrastructure/repositories/api-clinic-questionnaire-templates';

const repo = apiClinicQuestionnaireTemplatesRepository;

export const questionnaireTemplateKeys = {
    all: ['questionnaire-templates'] as const,
    detail: (id: string) => ['questionnaire-templates', id] as const,
};

export function useQuestionnaireTemplates() {
    return useQuery({
        queryKey: questionnaireTemplateKeys.all,
        queryFn: () => repo.list(),
    });
}

export function useQuestionnaireTemplate(id: string) {
    return useQuery({
        queryKey: questionnaireTemplateKeys.detail(id),
        queryFn: () => repo.findById(id),
        enabled: !!id,
    });
}

export function useCreateQuestionnaireTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: QuestionnaireTemplateWriteDto) => repo.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: questionnaireTemplateKeys.all,
            });
            toast.success('Questionário criado com sucesso');
        },
        onError: () => {
            toast.error('Erro ao criar questionário');
        },
    });
}

export function useUpdateQuestionnaireTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            dto,
        }: {
            id: string;
            dto: QuestionnaireTemplateWriteDto;
        }) => repo.update(id, dto),
        onSuccess: (template) => {
            queryClient.invalidateQueries({
                queryKey: questionnaireTemplateKeys.all,
            });
            queryClient.invalidateQueries({
                queryKey: questionnaireTemplateKeys.detail(String(template.id)),
            });
            toast.success('Questionário atualizado com sucesso');
        },
        onError: () => {
            toast.error('Erro ao atualizar questionário');
        },
    });
}

export function useDeleteQuestionnaireTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: questionnaireTemplateKeys.all,
            });
            toast.success('Questionário excluído com sucesso');
        },
        onError: () => {
            toast.error('Erro ao excluir questionário');
        },
    });
}
