import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AdminProgramWriteDto } from '@/application/admin/ports';
import { apiAdminProgramsRepository } from '@/infrastructure/repositories';

const PROGRAMS_KEY = ['admin', 'programs'] as const;

interface ListParams {
    search?: string;
    physioAreaId?: number | null;
    isActive?: boolean;
    perPage?: number;
    page?: number;
}

export function listAdminPrograms(params?: ListParams) {
    return apiAdminProgramsRepository.list(params);
}

export function findAdminProgramDetail(id: number) {
    return apiAdminProgramsRepository.getDetail(id);
}

export function useAdminPrograms(params?: ListParams) {
    return useQuery({
        queryKey: [...PROGRAMS_KEY, params],
        queryFn: () => apiAdminProgramsRepository.list(params),
    });
}

export function useAdminProgramDetail(id: number | undefined) {
    return useQuery({
        queryKey: [...PROGRAMS_KEY, 'detail', id],
        queryFn: () => apiAdminProgramsRepository.getDetail(id!),
        enabled: !!id,
    });
}

export function useCreateAdminProgram(options?: {
    onSuccess?: (id: number) => void;
}) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: AdminProgramWriteDto) =>
            apiAdminProgramsRepository.create(dto),
        onSuccess: (program) => {
            queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
            options?.onSuccess?.(program.id);
        },
    });
}

export function useUpdateAdminProgram(
    id: number,
    options?: { onSuccess?: () => void },
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: Partial<AdminProgramWriteDto>) =>
            apiAdminProgramsRepository.update(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
            options?.onSuccess?.();
        },
    });
}

export function useDeleteAdminProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => apiAdminProgramsRepository.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: PROGRAMS_KEY });
        },
    });
}
