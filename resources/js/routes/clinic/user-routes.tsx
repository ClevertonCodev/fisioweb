import { type RouteObject, useParams } from 'react-router-dom';

import { RequireClinicAdmin, RequireClinicUserSelfOrAdmin } from '@/components/clinic/RequireClinicAdmin';
import { UserEditPage } from '@/pages/clinic/user/UserEditPage';
import { UserListPage } from '@/pages/clinic/user/UserListPage';
import { UserNewPage } from '@/pages/clinic/user/UserNewPage';

function UserEditRoute() {
    const { id } = useParams<{ id: string }>();

    return (
        <RequireClinicUserSelfOrAdmin userId={id}>
            <UserEditPage />
        </RequireClinicUserSelfOrAdmin>
    );
}

export const userRoutes: RouteObject[] = [
    {
        path: '/clinica/usuarios',
        element: (
            <RequireClinicAdmin>
                <UserListPage />
            </RequireClinicAdmin>
        ),
    },
    {
        path: '/clinica/usuarios/novo',
        element: (
            <RequireClinicAdmin>
                <UserNewPage />
            </RequireClinicAdmin>
        ),
    },
    {
        path: '/clinica/usuarios/:id/editar',
        element: <UserEditRoute />,
    },
];
