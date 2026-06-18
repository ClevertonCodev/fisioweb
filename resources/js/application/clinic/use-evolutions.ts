import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    EvolutionTemplateWriteDto,
    EvolutionWriteDto,
} from '@/application/clinic/ports';
import { apiClinicEvolutionsRepository } from '@/infrastructure/repositories/api-clinic-evolutions';

const repo = apiClinicEvolutionsRepository;

const keys = {
    patientEvolutions: (patientId: string) =>
        ['evolutions', 'patient', patientId] as const,
    evolution: (id: string) => ['evolutions', id] as const,
    templates: () => ['evolutions', 'templates'] as const,
    template: (id: string) => ['evolutions', 'templates', id] as const,
};

export function usePatientEvolutions(patientId: string) {
    return useQuery({
        queryKey: keys.patientEvolutions(patientId),
        queryFn: () => repo.listByPatient(patientId),
        enabled: !!patientId,
    });
}

export function useEvolution(id: string) {
    return useQuery({
        queryKey: keys.evolution(id),
        queryFn: () => repo.find(id),
        enabled: !!id,
    });
}

export function useEvolutionTemplates() {
    return useQuery({
        queryKey: keys.templates(),
        queryFn: () => repo.listTemplates(),
    });
}

export function useEvolutionTemplate(id: string) {
    return useQuery({
        queryKey: keys.template(id),
        queryFn: () => repo.findTemplate(id),
        enabled: !!id,
    });
}

export function useCreateEvolutionTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: EvolutionTemplateWriteDto) =>
            repo.createTemplate(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.templates() });
            toast.success('Template criado com sucesso');
        },
        onError: () => {
            toast.error('Erro ao criar template');
        },
    });
}

export function useUpdateEvolutionTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            dto,
        }: {
            id: string;
            dto: EvolutionTemplateWriteDto;
        }) => repo.updateTemplate(id, dto),
        onSuccess: (template) => {
            const templateId = String(template.id);
            queryClient.invalidateQueries({ queryKey: keys.templates() });
            queryClient.invalidateQueries({
                queryKey: keys.template(templateId),
            });
            toast.success('Template atualizado com sucesso');
        },
        onError: () => {
            toast.error('Erro ao atualizar template');
        },
    });
}

export function useDeleteEvolutionTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.destroyTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.templates() });
            toast.success('Template excluído com sucesso');
        },
        onError: () => {
            toast.error('Erro ao excluir template');
        },
    });
}

export function useCreateEvolution(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: EvolutionWriteDto) => repo.create(patientId, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientEvolutions(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao criar evolução');
        },
    });
}

export function useUpdateEvolution(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: EvolutionWriteDto }) =>
            repo.update(id, dto),
        onSuccess: (evolution) => {
            queryClient.invalidateQueries({
                queryKey: keys.evolution(String(evolution.id)),
            });
            queryClient.invalidateQueries({
                queryKey: keys.patientEvolutions(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao salvar evolução');
        },
    });
}

export function useSignEvolution(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.sign(id),
        onSuccess: (evolution) => {
            queryClient.invalidateQueries({
                queryKey: keys.evolution(String(evolution.id)),
            });
            queryClient.invalidateQueries({
                queryKey: keys.patientEvolutions(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao assinar evolução');
        },
    });
}

export function useDeleteEvolution(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => repo.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientEvolutions(patientId),
            });
        },
        onError: () => {
            toast.error('Erro ao excluir evolução');
        },
    });
}

export function useGenerateEvolutionText() {
    return useMutation({
        mutationFn: ({
            id,
            checkedItemIds,
            freeTextValues,
        }: {
            id: string;
            checkedItemIds: number[];
            freeTextValues: { itemId: number; value: string }[];
        }) => repo.generateText(id, checkedItemIds, freeTextValues),
        onError: () => {
            toast.error('Erro ao gerar texto da evolução');
        },
    });
}

/** Abre o PDF da evolução em nova aba (Bearer via apiClient). */
export async function openEvolutionPdfInNewTab(
    evolutionId: string,
): Promise<void> {
    try {
        const blob = await repo.fetchPdfBlob(evolutionId);
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) {
            URL.revokeObjectURL(url);
            toast.error('Permita pop-ups para abrir o PDF.');
            return;
        }
        window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    } catch {
        toast.error('Erro ao abrir PDF da evolução.');
    }
}
