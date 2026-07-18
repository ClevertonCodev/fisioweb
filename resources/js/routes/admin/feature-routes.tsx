import { redirect, type RouteObject } from 'react-router-dom';

import { findFeatureById, listFeatures } from '@/application/admin';
import FeatureEditPage from '@/pages/admin/feature/FeatureEditPage';
import FeatureListPage from '@/pages/admin/feature/FeatureListPage';
import FeatureNewPage from '@/pages/admin/feature/FeatureNewPage';

export const featureRoutes: RouteObject[] = [
    {
        path: 'funcionalidades',
        element: <FeatureListPage />,
        loader: async () => {
            try {
                const features = await listFeatures();
                return { features, error: null };
            } catch (err) {
                const res = (err as { response?: { data?: { message?: string } } })?.response?.data;
                return {
                    features: [],
                    error:
                        res?.message ??
                        (err instanceof Error ? err.message : 'Erro ao carregar funcionalidades'),
                };
            }
        },
    },
    { path: 'funcionalidades/nova', element: <FeatureNewPage /> },
    {
        path: 'funcionalidades/:id/editar',
        element: <FeatureEditPage />,
        loader: async ({ params }) => {
            const id = parseInt(params.id!, 10);
            if (isNaN(id)) return redirect('/admin/funcionalidades');
            const feature = await findFeatureById(id);
            if (!feature) return redirect('/admin/funcionalidades');
            return feature;
        },
    },
];
