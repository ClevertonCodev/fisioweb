import { type RouteObject } from 'react-router-dom';

import ClinicEditPage from '@/pages/admin/clinic/ClinicEditPage';
import ClinicListPage from '@/pages/admin/clinic/ClinicListPage';
import ClinicNewPage from '@/pages/admin/clinic/ClinicNewPage';

export const clinicAdminRoutes: RouteObject[] = [
    { path: 'clinicas', element: <ClinicListPage /> },
    { path: 'clinicas/nova', element: <ClinicNewPage /> },
    { path: 'clinicas/:id/editar', element: <ClinicEditPage /> },
];
