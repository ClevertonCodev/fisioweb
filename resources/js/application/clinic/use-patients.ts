import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    PatientListParams,
    PatientUpdateDto,
    PatientWriteDto,
} from '@/application/clinic/ports';
import { apiClinicPatientsRepository } from '@/infrastructure/repositories/api-clinic-patients';

export function usePatients(params: PatientListParams = {}) {
    return useQuery({
        queryKey: ['patients', params],
        queryFn: () => apiClinicPatientsRepository.list(params),
    });
}

export function usePatient(id: string | undefined) {
    return useQuery({
        queryKey: ['patients', id],
        queryFn: () =>
            id
                ? apiClinicPatientsRepository.getById(id)
                : Promise.resolve(null),
        enabled: !!id,
    });
}

export function usePatientDetail(id: string | undefined) {
    return useQuery({
        queryKey: ['patients', id, 'detail'],
        queryFn: () =>
            id
                ? apiClinicPatientsRepository.getDetailById(id)
                : Promise.resolve(null),
        enabled: !!id,
    });
}

export function useUpdatePatient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: PatientUpdateDto }) =>
            apiClinicPatientsRepository.update(id, dto),
        onSuccess: (patient) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.invalidateQueries({
                queryKey: ['patients', patient.id, 'detail'],
            });
            toast.success('Paciente atualizado com sucesso');
        },
        onError: (error: {
            response?: { status?: number; data?: { message?: string } };
        }) => {
            if (error?.response?.status === 422) return;
            toast.error(
                error?.response?.data?.message ??
                    'Erro ao atualizar paciente. Verifique os dados e tente novamente.',
            );
        },
    });
}

export function useCreatePatient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: PatientWriteDto) =>
            apiClinicPatientsRepository.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            toast.success('Paciente cadastrado com sucesso');
        },
        onError: (error: {
            response?: { status?: number; data?: { message?: string } };
        }) => {
            if (error?.response?.status === 422) return;
            toast.error(
                error?.response?.data?.message ??
                    'Erro ao cadastrar paciente. Verifique os dados e tente novamente.',
            );
        },
    });
}

export function useBulkInactivatePatients() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (ids: string[]) =>
            apiClinicPatientsRepository.bulkInactivate(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
}

export function useReactivatePatient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicPatientsRepository.reactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        },
    });
}

export function useUploadPatientPhoto() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }: { id: string; file: File }) =>
            apiClinicPatientsRepository.uploadPhoto(id, file),
        onSuccess: (patient) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.setQueryData(['patients', patient.id], patient);
        },
    });
}

export function useDeletePatientPhoto() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicPatientsRepository.deletePhoto(id),
        onSuccess: (patient) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.setQueryData(['patients', patient.id], patient);
        },
    });
}
