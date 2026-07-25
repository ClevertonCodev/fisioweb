import { RouteObject } from 'react-router-dom';
import PatientProgramListPage from '@/pages/patient/program/PatientProgramListPage';
import PatientProgramDetailPage from '@/pages/patient/program/PatientProgramDetailPage';
import PatientExerciseDetailPage from '@/pages/patient/program/PatientExerciseDetailPage';
import PatientProgramExecutionPage from '@/pages/patient/program/PatientProgramExecutionPage';
import PatientProgramFeedbackPage from '@/pages/patient/program/PatientProgramFeedbackPage';
import PatientProgramSuccessPage from '@/pages/patient/program/PatientProgramSuccessPage';
import PatientProgramDeepLinkPage from '@/pages/patient/PatientProgramDeepLinkPage';

export const patientProgramRoutes: RouteObject[] = [
    {
        path: '/:clinicSlug/paciente/programas/:publicToken',
        element: <PatientProgramDeepLinkPage />,
    },
    {
        path: '/lista-programas',
        element: <PatientProgramListPage />,
    },
    {
        path: '/detalhe-programa',
        element: <PatientProgramDetailPage />,
    },
    {
        path: '/detalhe-exercicio',
        element: <PatientExerciseDetailPage />,
    },
    {
        path: '/execucao-programa',
        element: <PatientProgramExecutionPage />,
    },
    {
        path: '/avaliacao-programa',
        element: <PatientProgramFeedbackPage />,
    },
    {
        path: '/sucesso-programa',
        element: <PatientProgramSuccessPage />,
    },
];
