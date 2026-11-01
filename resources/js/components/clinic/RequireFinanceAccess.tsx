import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

/** Finanças abre para administrador e secretária; a API é quem protege de verdade (403). */
export function RequireFinanceAccess({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const role = user?.role as ClinicRole | undefined;

    if (isLoading) {
        return null;
    }

    if (!can.manageFinances(role)) {
        return (
            <Navigate
                to="/clinica"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return children;
}
