import { type RouteObject } from 'react-router-dom';

import QuestionnaireTemplateEditPage from '@/pages/clinic/questionnaire-template/QuestionnaireTemplateEditPage';
import QuestionnaireTemplateNewPage from '@/pages/clinic/questionnaire-template/QuestionnaireTemplateNewPage';

export const questionnaireTemplateRoutes: RouteObject[] = [
    {
        path: '/clinica/questionarios/novo',
        element: <QuestionnaireTemplateNewPage />,
    },
    {
        path: '/clinica/questionarios/:id/editar',
        element: <QuestionnaireTemplateEditPage />,
    },
];
