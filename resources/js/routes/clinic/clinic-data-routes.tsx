import { type RouteObject } from 'react-router-dom';

import { RequireClinicAdmin } from '@/components/clinic/RequireClinicAdmin';
import { ClinicDataPage } from '@/pages/clinic/clinic-data/ClinicDataPage';

export const clinicDataRoutes: RouteObject[] = [
    {
        path: '/clinica/dados',
        element: (
            <RequireClinicAdmin>
                <ClinicDataPage />
            </RequireClinicAdmin>
        ),
    },
];
