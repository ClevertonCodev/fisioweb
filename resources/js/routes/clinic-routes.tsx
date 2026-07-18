import { type QueryClient } from '@tanstack/react-query';
import { type RouteObject } from 'react-router-dom';

import { RequireClinicAdmin } from '@/components/clinic/RequireClinicAdmin';
import AgendaPage from '@/pages/clinic/AgendaPage';
import ClinicForgotPasswordPage from '@/pages/clinic/ClinicForgotPasswordPage';
import ClinicLoginPage from '@/pages/clinic/ClinicLoginPage';
import ClinicRegisterPage from '@/pages/clinic/ClinicRegisterPage';
import ClinicResetPasswordPage from '@/pages/clinic/ClinicResetPasswordPage';
import ClinicSubmitExercisePage from '@/pages/clinic/ClinicSubmitExercisePage';
import DashboardPage from '@/pages/clinic/DashboardPage';
import ExercisesPage from '@/pages/clinic/ExercisesPage';
import ImpersonatePage from '@/pages/clinic/ImpersonatePage';

import { clinicDataRoutes } from './clinic/clinic-data-routes';
import { evolutionTemplateRoutes } from './clinic/evolution-template-routes';
import { financeRoutes } from './clinic/finance-routes';
import { patientRoutes } from './clinic/patient-routes';
import { programClinicRoutes } from './clinic/program-routes';
import { questionnaireTemplateRoutes } from './clinic/questionnaire-template-routes';
import { userRoutes } from './clinic/user-routes';

export function clinicRoutes(queryClient: QueryClient): RouteObject[] {
    return [
        { path: '/clinica/login', element: <ClinicLoginPage /> },
        { path: '/clinica/criar-conta', element: <ClinicRegisterPage /> },
        {
            path: '/clinica/recuperar-senha',
            element: <ClinicForgotPasswordPage />,
        },
        {
            path: '/clinica/redefinir-senha',
            element: <ClinicResetPasswordPage />,
        },
        { path: '/clinica/entrar', element: <ImpersonatePage /> },

        { path: '/clinica', element: <DashboardPage /> },
        { path: '/clinica/agenda', element: <AgendaPage /> },
        { path: '/clinica/exercicios', element: <ExercisesPage /> },
        {
            path: '/clinica/exercicios/enviar',
            element: (
                <RequireClinicAdmin>
                    <ClinicSubmitExercisePage />
                </RequireClinicAdmin>
            ),
        },
        ...evolutionTemplateRoutes,
        ...questionnaireTemplateRoutes,
        ...patientRoutes,
        ...programClinicRoutes(queryClient),
        ...userRoutes,
        ...financeRoutes,
        ...clinicDataRoutes,
    ];
}
