import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ApiErrorResponse } from '@/domain/api';
import { apiClinicPatientFilesRepository } from '@/infrastructure/repositories/api-clinic-patient-files';

const repo = apiClinicPatientFilesRepository;

export interface UploadPatientFileVariables {
    file: File;
    name?: string;
    onUploadProgress?: (percent: number) => void;
}

const keys = {
    patientFiles: (patientId: string) =>
        ['patient-files', 'patient', patientId] as const,
    fileUrl: (patientId: string, fileId: string) =>
        ['patient-files', 'url', patientId, fileId] as const,
};

/** O link assinado vale 5 minutos: renova um pouco antes de vencer. */
const LINK_STALE_MS = 4 * 60 * 1000;

export function usePatientFiles(patientId: string) {
    return useQuery({
        queryKey: keys.patientFiles(patientId),
        queryFn: () => repo.listByPatient(patientId),
        enabled: !!patientId,
    });
}

export function useUploadPatientFile(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (vars: UploadPatientFileVariables) =>
            repo.store(patientId, vars.file, {
                name: vars.name,
                onUploadProgress: vars.onUploadProgress,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientFiles(patientId),
            });
            toast.success('Arquivo enviado com sucesso');
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ?? 'Erro ao enviar arquivo',
            );
        },
    });
}

export function useDeletePatientFile(patientId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (fileId: string) => repo.destroy(patientId, fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: keys.patientFiles(patientId),
            });
            toast.success('Arquivo excluído com sucesso');
        },
        onError: () => {
            toast.error('Erro ao excluir arquivo');
        },
    });
}

/** Link assinado de um arquivo, para mostrar a prévia da imagem na tela. */
export function usePatientFileUrl(
    patientId: string,
    fileId: string,
    enabled = true,
) {
    return useQuery({
        queryKey: keys.fileUrl(patientId, fileId),
        queryFn: () => repo.getUrl(patientId, fileId),
        enabled: enabled && !!patientId && !!fileId,
        staleTime: LINK_STALE_MS,
        gcTime: LINK_STALE_MS,
    });
}

/**
 * Abre o arquivo numa aba nova pelo link assinado. A aba abre antes do pedido
 * (no clique), senão o navegador do celular bloqueia como pop-up.
 */
export function useOpenPatientFile(patientId: string) {
    return useMutation({
        mutationFn: async (fileId: string) => {
            const tab = window.open('', '_blank');
            try {
                const link = await repo.getUrl(patientId, fileId);
                if (tab) {
                    tab.opener = null;
                    tab.location.href = link.url;
                } else window.location.assign(link.url);
                return link;
            } catch (error) {
                tab?.close();
                throw error;
            }
        },
        onError: () =>
            toast.error('Não foi possível abrir o arquivo. Tente de novo.'),
    });
}
