import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiClinicProgramsLibraryRepository } from '@/infrastructure/repositories';
import type { ClinicProgramsLibraryParams } from '@/infrastructure/repositories/api-clinic-programs-library';

const PROGRAMS_LIBRARY_KEY = ['clinic', 'programs-library'] as const;

export function listClinicProgramsLibraryPaginated(params?: ClinicProgramsLibraryParams) {
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

export function useClinicProgramLibraryDetail(id: number | null) {
    return useQuery({
        queryKey: [...PROGRAMS_LIBRARY_KEY, 'detail', id],
        queryFn: () => apiClinicProgramsLibraryRepository.getDetail(id!),
        enabled: !!id,
    });
}
