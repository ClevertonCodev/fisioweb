import { RouteObject } from 'react-router-dom';

import PatientLoginPage from '@/pages/patient/auth/PatientLoginPage';

export const patientAuthRoutes: RouteObject[] = [
    // Sem slug: o paciente informa o identificador e escolhe a clínica.
    {
        path: '/paciente/login',
        element: <PatientLoginPage />,
    },
    // Com slug: a clínica vem do contexto e o login é em uma etapa só.
    {
        path: '/:clinicSlug/paciente/login',
        element: <PatientLoginPage />,
    },
];
