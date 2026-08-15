import { RouteObject } from 'react-router-dom';

import PatientLoginPage from '@/pages/patient/auth/PatientLoginPage';

export const patientAuthRoutes: RouteObject[] = [
    {
        path: '/paciente/login',
        element: <PatientLoginPage />,
    },
    {
        path: '/:clinicSlug/paciente/login',
        element: <PatientLoginPage />,
    },
];
