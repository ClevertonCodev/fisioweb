import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    createBrowserRouter,
    Navigate,
    RouterProvider,
} from 'react-router-dom';

import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { adminRoutes } from '@/routes/admin-routes';
import { clinicRoutes } from '@/routes/clinic-routes';
import { patientAuthRoutes } from '@/routes/patient/auth-routes';
import { patientProgramRoutes } from '@/routes/patient/program-routes';

import NotFound from './pages/NotFound';

/** `/login` é legado: mantém favoritos antigos funcionando, com a query. */
function LegacyLoginRedirect() {
    return <Navigate to={`/paciente/login${window.location.search}`} replace />;
}

const queryClient = new QueryClient();

const router = createBrowserRouter(
    [
        { path: '/', element: <Navigate to="/clinica/login" replace /> },
        { path: '/login', element: <LegacyLoginRedirect /> },
        ...clinicRoutes(queryClient),
        adminRoutes,
        ...patientAuthRoutes,
        ...patientProgramRoutes,
        { path: '*', element: <NotFound /> },
    ],
    {
        future: {
            v7_relativeSplatPath: true,
        },
    },
);

const App = () => (
    <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <TooltipProvider>
                <Sonner />
                <RouterProvider
                    router={router}
                    future={{ v7_startTransition: true }}
                />
            </TooltipProvider>
        </AuthProvider>
    </QueryClientProvider>
);

export default App;
