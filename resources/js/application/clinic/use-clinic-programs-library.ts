import {
    useInfiniteQuery,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { apiClinicProgramsLibraryRepository } from '@/infrastructure/repositories';
import type {
    ClinicProgramsLibraryParams,
    SharedProgram,
} from '@/infrastructure/repositories/api-clinic-programs-library';

const PROGRAMS_LIBRARY_KEY = ['clinic', 'programs-library'] as const;

export function listClinicProgramsLibraryPaginated(
    params?: ClinicProgramsLibraryParams,
) {
    return apiClinicProgramsLibraryRepository.list(params);
}

export function useClinicProgramsLibrary(params?: ClinicProgramsLibraryParams) {
    return useQuery({
        queryKey: [...PROGRAMS_LIBRARY_KEY, params],
        queryFn: () => apiClinicProgramsLibraryRepository.list(params),
    });
}

export function useInfiniteClinicProgramsLibrary(
    params?: Omit<ClinicProgramsLibraryParams, 'page'>,
) {
    return useInfiniteQuery({
        queryKey: [...PROGRAMS_LIBRARY_KEY, 'infinite', params ?? null],
        queryFn: ({ pageParam }) =>
            apiClinicProgramsLibraryRepository.list({
                ...params,
                page: pageParam as number,
                perPage: 20,
            }),
        getNextPageParam: (lastPage) =>
            lastPage.meta.currentPage < lastPage.meta.lastPage
                ? lastPage.meta.currentPage + 1
                : undefined,
        initialPageParam: 1,
        staleTime: Infinity,
    });
}

/** Todas as páginas do catálogo: os filtros de Nossos modelos rodam no navegador. */
export async function listAllClinicProgramsLibrary(
    params?: Omit<ClinicProgramsLibraryParams, 'page' | 'perPage'>,
) {
    const items: SharedProgram[] = [];
    for (let page = 1; ; page++) {
        const result = await apiClinicProgramsLibraryRepository.list({
            ...params,
            page,
            perPage: 200,
        });
        items.push(...result.data);
        if (page >= result.meta.lastPage || result.data.length === 0) {
            return [...new Map(items.map((p) => [p.id, p])).values()];
        }
    }
}

export function useClinicProgramLibraryDetail(
    id: number | null,
    enabled = true,
) {
    return useQuery({
        queryKey: [...PROGRAMS_LIBRARY_KEY, 'detail', id],
        queryFn: () => apiClinicProgramsLibraryRepository.getDetail(id!),
        enabled: !!id && enabled,
    });
}

/** Detalhe sob demanda, no mesmo cache de `useClinicProgramLibraryDetail`. */
export function useFetchClinicProgramLibraryDetail() {
    const queryClient = useQueryClient();
    return (id: number) =>
        queryClient.fetchQuery({
            queryKey: [...PROGRAMS_LIBRARY_KEY, 'detail', id],
            queryFn: () => apiClinicProgramsLibraryRepository.getDetail(id),
        });
}
