import { type RouteObject } from 'react-router-dom';

import EvolutionTemplateEditPage from '@/pages/clinic/evolution-template/EvolutionTemplateEditPage';
import EvolutionTemplateListPage from '@/pages/clinic/evolution-template/EvolutionTemplateListPage';
import EvolutionTemplateNewPage from '@/pages/clinic/evolution-template/EvolutionTemplateNewPage';

export const evolutionTemplateRoutes: RouteObject[] = [
    {
        path: '/clinica/templates/evolucoes',
        element: <EvolutionTemplateListPage />,
    },
    {
        path: '/clinica/templates/evolucoes/novo',
        element: <EvolutionTemplateNewPage />,
    },
    {
        path: '/clinica/templates/evolucoes/:id/editar',
        element: <EvolutionTemplateEditPage />,
    },
];
