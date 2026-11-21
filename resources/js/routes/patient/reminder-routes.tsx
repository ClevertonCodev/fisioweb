import { RouteObject } from 'react-router-dom';

import ReminderUnsubscribePage from '@/pages/patient/reminders/ReminderUnsubscribePage';

export const patientReminderRoutes: RouteObject[] = [
    {
        path: '/lembretes/sair',
        element: <ReminderUnsubscribePage />,
    },
];
