import { type RouteObject } from 'react-router-dom';

import AssessmentEditPage from '@/pages/clinic/patient/AssessmentEditPage';
import AssessmentNewPage from '@/pages/clinic/patient/AssessmentNewPage';
import PatientEditPage from '@/pages/clinic/patient/PatientEditPage';
import PatientListPage from '@/pages/clinic/patient/PatientListPage';
import PatientNewPage from '@/pages/clinic/patient/PatientNewPage';
import PatientRecordPage from '@/pages/clinic/patient/PatientRecordPage';

export const patientRoutes: RouteObject[] = [
    { path: '/clinica/pacientes', element: <PatientListPage /> },
    { path: '/clinica/pacientes/novo', element: <PatientNewPage /> },
    { path: '/clinica/pacientes/:id', element: <PatientRecordPage /> },
    { path: '/clinica/pacientes/:id/editar', element: <PatientEditPage /> },
    { path: '/clinica/pacientes/:id/avaliacoes/nova', element: <AssessmentNewPage /> },
    { path: '/clinica/pacientes/:id/avaliacoes/:assessmentId/editar', element: <AssessmentEditPage /> },
];
