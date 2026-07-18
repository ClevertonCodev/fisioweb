import { type RouteObject } from 'react-router-dom';

import { RequireClinicAdmin } from '@/components/clinic/RequireClinicAdmin';
import FinancesCategoriesPage from '@/pages/clinic/finances/FinancesCategoriesPage';
import FinancesPage from '@/pages/clinic/finances/FinancesPage';
import FinancesTrashPage from '@/pages/clinic/finances/FinancesTrashPage';

export const financeRoutes: RouteObject[] = [
    {
        path: '/clinica/financas',
        element: (
            <RequireClinicAdmin>
                <FinancesPage />
            </RequireClinicAdmin>
        ),
    },
    {
        path: '/clinica/financas/lixeira',
        element: (
            <RequireClinicAdmin>
                <FinancesTrashPage />
            </RequireClinicAdmin>
        ),
    },
    {
        path: '/clinica/financas/categorias',
        element: (
            <RequireClinicAdmin>
                <FinancesCategoriesPage />
            </RequireClinicAdmin>
        ),
    },
];
