import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    AssessmentUpdateDto,
    AssessmentWriteDto,
} from '@/application/clinic/ports';
import type {
    AssessmentSummary,
    AssessmentTemplateSummary,
} from '@/domain/clinic';
import { apiClinicAssessmentsRepository } from '@/infrastructure/repositories/api-clinic-assessments';

const repo = apiClinicAssessmentsRepository;

const keys = {
    patientAssessments: (patientId: string) =>
        ['assessments', 'patient', patientId] as const,
    assessment: (id: string) => ['assessments', id] as const,
    templates: (search?: string) =>
        ['assessment-templates', search ?? ''] as const,
    template: (id: string | null) => ['assessment-templates', id] as const,
};

export function usePatientAssessments(patientId: string) {
    return useQuery({
        queryKey: keys.patientAssessments(patientId),
        queryFn: () => repo.listByPatient(patientId),
        enabled: !!patientId,
    });
}

export function useAssessment(id: string) {
    return useQuery({
        queryKey: keys.assessment(id),
        queryFn: () => repo.find(id),
        enabled: !!id,
    });
}

export function useAssessmentTemplates(search?: string) {
    return useQuery({
        queryKey: keys.templates(search),
        queryFn: () => repo.listTemplates({ search, perPage: 100 }),
        select: (result) => result.data,
    });
}

export function useAssessmentTemplate(id: string | null) {
    return useQuery({
        queryKey: keys.template(id),
        queryFn: () => repo.findTemplate(id!),
        enabled: !!id,
    });
}

export function useCreateAssessment(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: AssessmentWriteDto) => repo.create(patientId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientAssessments(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao criar avaliação');
        },
    });
}

export function useUpdateAssessment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: AssessmentUpdateDto }) =>
            repo.update(id, dto),
        onSuccess: (assessment) => {
            queryClient.invalidateQueries({
                queryKey: keys.assessment(String(assessment.id)),
            });
        },
        onError: () => {
            toast.error('Erro ao salvar avaliação');
        },
    });
}

export function useSignAssessment(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.sign(id),
        onSuccess: (assessment) => {
            queryClient.invalidateQueries({
                queryKey: keys.assessment(String(assessment.id)),
            });
            queryClient.invalidateQueries({
                queryKey: keys.patientAssessments(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao assinar avaliação');
        },
    });
}

export function useDeleteAssessment(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientAssessments(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao excluir avaliação');
        },
    });
}

export async function listPatientAssessments(
    patientId: string,
): Promise<AssessmentSummary[]> {
    return repo.listByPatient(patientId);
}

export async function listAssessmentTemplates(): Promise<
    AssessmentTemplateSummary[]
> {
    const result = await repo.listTemplates({ perPage: 100 });
    return result.data;
}
