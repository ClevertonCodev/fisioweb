import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    ProgramListParams,
    ProgramWriteDto,
} from '@/application/clinic/ports';
import type { Program } from '@/domain/clinic';
import { apiClinicProgramsRepository } from '@/infrastructure/repositories';

export function listClinicPrograms(params?: ProgramListParams) {
    return apiClinicProgramsRepository.list(params);
}

export function useClinicPrograms(params?: ProgramListParams) {
    return useQuery({
        queryKey: ['clinic-programs', params ?? {}],
        queryFn: () => listClinicPrograms(params),
        staleTime: Infinity,
    });
}

export function useClinicProgramsQuery(
    params?: ProgramListParams,
    enabled = true,
) {
    return useQuery({
        queryKey: ['clinic-programs', params ?? {}],
        queryFn: () => listClinicPrograms(params),
        enabled,
    });
}

export function listMyModelsPaginated(params?: ProgramListParams) {
    return apiClinicProgramsRepository.list({
        ...params,
        withoutPatient: true,
    });
}

export function useInfiniteMyPrograms(
    params?: Omit<ProgramListParams, 'page' | 'withoutPatient'>,
) {
    return useInfiniteQuery({
        queryKey: ['clinic-programs', 'infinite-my-models', params ?? null],
        queryFn: ({ pageParam }) =>
            apiClinicProgramsRepository.list({
                ...params,
                withoutPatient: true,
                page: pageParam as number,
                perPage: 20,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.currentPage < lastPage.lastPage
                ? lastPage.currentPage + 1
                : undefined,
        initialPageParam: 1,
        staleTime: Infinity,
    });
}

export function findClinicProgram(id: string): Promise<Program | null> {
    return apiClinicProgramsRepository.getById(id);
}

export function useClinicProgram(id: string | undefined) {
    return useQuery({
        queryKey: ['clinic-programs', id],
        queryFn: () =>
            id
                ? apiClinicProgramsRepository.getById(id)
                : Promise.resolve(null),
        enabled: !!id,
    });
}

export function useCreateClinicProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (dto: ProgramWriteDto) =>
            apiClinicProgramsRepository.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinic-programs'] });
        },
        onError: () => {
            toast.error('Erro ao salvar programa. Tente novamente.');
        },
    });
}

export function useDuplicateClinicProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicProgramsRepository.duplicate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinic-programs'] });
            toast.success('Programa duplicado com sucesso.');
        },
        onError: () => {
            toast.error('Erro ao duplicar programa. Tente novamente.');
        },
    });
}

export function useUpdateClinicProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: ProgramWriteDto }) =>
            apiClinicProgramsRepository.update(id, dto),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['clinic-programs'] });
            queryClient.invalidateQueries({
                queryKey: ['clinic-programs', id],
            });
        },
        onError: () => {
            toast.error('Erro ao salvar programa. Tente novamente.');
        },
    });
}

export function useDeleteClinicProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicProgramsRepository.destroy(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinic-programs'] });
            toast.success('Programa excluído.');
        },
        onError: () => {
            toast.error('Erro ao excluir programa. Tente novamente.');
        },
    });
}

export function useConvertToModelClinicProgram() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiClinicProgramsRepository.toModel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clinic-programs'] });
            toast.success('Programa salvo como modelo.');
        },
        onError: () => {
            toast.error('Erro ao transformar em modelo. Tente novamente.');
        },
    });
}
