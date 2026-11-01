import { type RouteObject } from 'react-router-dom';

import { RequireFinanceAccess } from '@/components/clinic/RequireFinanceAccess';
import FinancesCategoriesPage from '@/pages/clinic/finances/FinancesCategoriesPage';
import FinancesPage from '@/pages/clinic/finances/FinancesPage';
import FinancesTrashPage from '@/pages/clinic/finances/FinancesTrashPage';

export const financeRoutes: RouteObject[] = [
    {
        path: '/clinica/financas',
        element: (
            <RequireFinanceAccess>
                <FinancesPage />
            </RequireFinanceAccess>
        ),
    },
    {
        path: '/clinica/financas/lixeira',
        element: (
            <RequireFinanceAccess>
                <FinancesTrashPage />
            </RequireFinanceAccess>
        ),
    },
    {
        path: '/clinica/financas/categorias',
        element: (
            <RequireFinanceAccess>
                <FinancesCategoriesPage />
            </RequireFinanceAccess>
        ),
    },
];
