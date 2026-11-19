import { RouteObject } from 'react-router-dom';

import PublicQuestionnaireAnswerPage from '@/pages/patient/questionnaire/PublicQuestionnaireAnswerPage';

export const patientQuestionnaireRoutes: RouteObject[] = [
    {
        path: '/:clinicSlug/paciente/questionarios/:token',
        element: <PublicQuestionnaireAnswerPage />,
    },
];
