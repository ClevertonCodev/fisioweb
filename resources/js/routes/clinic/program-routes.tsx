import { type QueryClient } from '@tanstack/react-query';
import { Navigate, type RouteObject } from 'react-router-dom';

import { listExercisesPaginated } from '@/application/clinic/use-exercises';
import { findClinicProgram } from '@/application/clinic/use-programs';
import { ClinicLoaderError } from '@/components/clinic/ClinicLoaderError';
import { ProgramasTab } from '@/components/clinic/program/ProgramasTab';
import ExercisesPage from '@/pages/clinic/ExercisesPage';
import ProgramDetailPage from '@/pages/clinic/program/ProgramDetailPage';
import ProgramEditPage from '@/pages/clinic/program/ProgramEditPage';
import ProgramHistoryTab from '@/pages/clinic/program/ProgramHistoryTab';
import ProgramListPage from '@/pages/clinic/program/ProgramListPage';
import ProgramNewPage from '@/pages/clinic/program/ProgramNewPage';

export function programClinicRoutes(queryClient: QueryClient): RouteObject[] {
    return [
        {
            path: '/clinica/programas',
            element: <ProgramListPage />,
            errorElement: <ClinicLoaderError />,
            children: [
                { index: true, element: <Navigate to="historico" replace /> },
                {
                    path: 'historico',
                    element: <ProgramHistoryTab />,
                },
                {
                    path: 'exercicios',
                    element: <ExercisesPage embedded />,
                },
                {
                    path: 'modelos',
                    element: <ProgramasTab subTab="modelos" />,
                },
                {
                    path: 'meus-modelos',
                    element: <ProgramasTab subTab="meus-modelos" />,
                },
            ],
        },
        {
            path: '/clinica/programas/novo',
            element: <ProgramNewPage />,
            loader: async () => {
                await queryClient.fetchInfiniteQuery({
                    queryKey: ['exercises-infinite'],
                    queryFn: ({ pageParam }) =>
                        listExercisesPaginated({
                            page: pageParam as number,
                            perPage: 20,
                        }),
                    getNextPageParam: (
                        lastPage: Awaited<
                            ReturnType<typeof listExercisesPaginated>
                        >,
                    ) =>
                        lastPage.currentPage < lastPage.lastPage
                            ? lastPage.currentPage + 1
                            : undefined,
                    initialPageParam: 1,
                });
                return null;
            },
        },
        {
            path: '/clinica/programas/:id',
            element: <ProgramDetailPage />,
            errorElement: <ClinicLoaderError />,
            loader: async ({ params }) => {
                await queryClient.fetchQuery({
                    queryKey: ['clinic-programs', params.id],
                    queryFn: () => findClinicProgram(params.id!),
                });
                return { program: null, error: null };
            },
        },
        {
            path: '/clinica/programas/:id/editar',
            element: <ProgramEditPage />,
            errorElement: <ClinicLoaderError />,
            loader: async ({ params }) => {
                await queryClient.fetchQuery({
                    queryKey: ['clinic-programs', params.id],
                    queryFn: () => findClinicProgram(params.id!),
                });
                return null;
            },
        },
    ];
}
