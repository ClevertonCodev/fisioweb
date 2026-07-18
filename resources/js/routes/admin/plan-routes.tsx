import { redirect, type RouteObject } from 'react-router-dom';

import {
    findPlanById,
    listFeaturePlans,
    listFeatures,
    listPlans,
} from '@/application/admin';
import ConfigureFeaturesPage from '@/pages/admin/feature/ConfigureFeaturesPage';
import PlanEditPage from '@/pages/admin/plan/PlanEditPage';
import PlanListPage from '@/pages/admin/plan/PlanListPage';
import PlanNewPage from '@/pages/admin/plan/PlanNewPage';

export const planRoutes: RouteObject[] = [
    {
        path: 'planos',
        element: <PlanListPage />,
        loader: async () => {
            try {
                const plans = await listPlans();
                return { plans, error: null };
            } catch (err) {
                const res = (
                    err as { response?: { data?: { message?: string } } }
                )?.response?.data;
                return {
                    plans: [],
                    error:
                        res?.message ??
                        (err instanceof Error
                            ? err.message
                            : 'Erro ao carregar planos'),
                };
            }
        },
    },
    { path: 'planos/novo', element: <PlanNewPage /> },
    {
        path: 'planos/:id/editar',
        element: <PlanEditPage />,
        loader: async ({ params }) => {
            const id = parseInt(params.id!, 10);
            if (isNaN(id)) return redirect('/admin/planos');
            const plan = await findPlanById(id);
            if (!plan) return redirect('/admin/planos');
            return plan;
        },
    },
    {
        path: 'planos/configurar',
        element: <ConfigureFeaturesPage />,
        loader: async () => {
            try {
                const [featurePlans, plans, features] = await Promise.all([
                    listFeaturePlans(),
                    listPlans(),
                    listFeatures(),
                ]);
                return { featurePlans, plans, features, error: null };
            } catch (err) {
                const res = (
                    err as { response?: { data?: { message?: string } } }
                )?.response?.data;
                return {
                    featurePlans: [],
                    plans: [],
                    features: [],
                    error:
                        res?.message ??
                        (err instanceof Error
                            ? err.message
                            : 'Erro ao carregar configurações.'),
                };
            }
        },
    },
];
