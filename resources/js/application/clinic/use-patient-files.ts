import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useOpenSignedLink } from '@/application/clinic/use-open-signed-link';
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
    previews: (patientId: string) =>
        ['patient-files', 'previews', patientId] as const,
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
            queryClient.invalidateQueries({
                queryKey: keys.previews(patientId),
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
            queryClient.invalidateQueries({
                queryKey: keys.previews(patientId),
            });
            toast.success('Arquivo excluído com sucesso');
        },
        onError: () => {
            toast.error('Erro ao excluir arquivo');
        },
    });
}

export function usePatientFilePreviews(patientId: string) {
    return useQuery({
        queryKey: keys.previews(patientId),
        queryFn: () => repo.listPreviews(patientId),
        enabled: !!patientId,
        staleTime: LINK_STALE_MS,
        gcTime: LINK_STALE_MS,
    });
}

export function useOpenPatientFile(patientId: string) {
    return useOpenSignedLink(
        (fileId) => repo.getUrl(patientId, fileId),
        'Não foi possível abrir o arquivo. Tente de novo.',
    );
}
