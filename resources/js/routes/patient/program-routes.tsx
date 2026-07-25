import { RouteObject } from 'react-router-dom';

import PatientExerciseDetailPage from '@/pages/patient/program/PatientExerciseDetailPage';
import PatientProgramDetailPage from '@/pages/patient/program/PatientProgramDetailPage';
import PatientProgramExecutionPage from '@/pages/patient/program/PatientProgramExecutionPage';
import PatientProgramFeedbackPage from '@/pages/patient/program/PatientProgramFeedbackPage';
import PatientProgramListPage from '@/pages/patient/program/PatientProgramListPage';
import PatientProgramSuccessPage from '@/pages/patient/program/PatientProgramSuccessPage';

export const patientProgramRoutes: RouteObject[] = [
    {
        path: '/:clinicSlug/paciente/programas',
        element: <PatientProgramListPage />,
    },
    {
        path: '/:clinicSlug/paciente/programas/:publicToken',
        element: <PatientProgramDetailPage />,
    },
    {
        path: '/:clinicSlug/paciente/programas/:publicToken/exercicios/:exerciseId',
        element: <PatientExerciseDetailPage />,
    },
    {
        path: '/:clinicSlug/paciente/programas/:publicToken/executar',
        element: <PatientProgramExecutionPage />,
    },
    {
        path: '/:clinicSlug/paciente/programas/:publicToken/executar/feedback',
        element: <PatientProgramFeedbackPage />,
    },
    {
        path: '/:clinicSlug/paciente/programas/:publicToken/executar/concluido',
        element: <PatientProgramSuccessPage />,
    },
];
