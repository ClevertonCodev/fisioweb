import { type RouteObject, useNavigate, useRouteError } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminForgotPasswordPage from '@/pages/admin/AdminForgotPasswordPage';
import AdminLoginPage from '@/pages/admin/AdminLoginPage';
import AdminResetPasswordPage from '@/pages/admin/AdminResetPasswordPage';

import { clinicAdminRoutes } from './admin/clinic-routes';
import { exerciseRoutes } from './admin/exercise-routes';
import { featureRoutes } from './admin/feature-routes';
import { planRoutes } from './admin/plan-routes';
import { programAdminRoutes } from './admin/program-routes';

export function AdminLoaderError() {
    const error = useRouteError();
    const navigate = useNavigate();

    const message =
        error instanceof Error
            ? error.message
            : ((error as { statusText?: string })?.statusText ??
              'Erro desconhecido');

    return (
        <AdminLayout>
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Não foi possível carregar os dados.
                </p>
                <p className="font-mono text-sm text-destructive">{message}</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Voltar
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                        Tentar novamente
                    </Button>
                </div>
            </div>
        </AdminLayout>
    );
}

export const adminRoutes: RouteObject = {
    path: '/admin',
    errorElement: <AdminLoaderError />,
    children: [
        { path: '', element: <AdminDashboardPage /> },
        { path: 'login', element: <AdminLoginPage /> },
        { path: 'recuperar-senha', element: <AdminForgotPasswordPage /> },
        { path: 'redefinir-senha', element: <AdminResetPasswordPage /> },
        ...clinicAdminRoutes,
        ...featureRoutes,
        ...planRoutes,
        ...exerciseRoutes,
        ...programAdminRoutes,
    ],
};
