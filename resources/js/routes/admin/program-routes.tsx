import { redirect, type RouteObject } from 'react-router-dom';

import { findAdminProgramDetail } from '@/application/admin';
import AdminProgramDetailPage from '@/pages/admin/program/ProgramDetailPage';
import AdminProgramEditPage from '@/pages/admin/program/ProgramEditPage';
import AdminProgramListPage from '@/pages/admin/program/ProgramListPage';
import AdminProgramNewPage from '@/pages/admin/program/ProgramNewPage';

export const programAdminRoutes: RouteObject[] = [
    { path: 'programas', element: <AdminProgramListPage /> },
    { path: 'programas/novo', element: <AdminProgramNewPage /> },
    {
        path: 'programas/:id',
        element: <AdminProgramDetailPage />,
        loader: async ({ params }) => {
            const id = parseInt(params.id!, 10);
            if (isNaN(id)) return redirect('/admin/programas');
            return findAdminProgramDetail(id);
        },
    },
    {
        path: 'programas/:id/editar',
        element: <AdminProgramEditPage />,
        loader: async ({ params }) => {
            const id = parseInt(params.id!, 10);
            if (isNaN(id)) return redirect('/admin/programas');
            return findAdminProgramDetail(id);
        },
    },
];
