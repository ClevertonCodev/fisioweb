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
};

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
