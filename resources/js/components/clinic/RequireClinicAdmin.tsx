import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

export function RequireClinicAdmin({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const role = user?.role as ClinicRole | undefined;

    if (isLoading) {
        return null;
    }

    if (!can.manageUsers(role)) {
        return <Navigate to="/clinica" replace state={{ from: location.pathname }} />;
    }

    return children;
}

export function RequireClinicUserSelfOrAdmin({
    children,
    userId,
}: {
    children: ReactNode;
    userId?: string;
}) {
    const { user, isLoading } = useAuth();
    const location = useLocation();
    const role = user?.role as ClinicRole | undefined;

    if (isLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/clinica/login" replace state={{ from: location.pathname }} />;
    }

    if (!userId) {
        return <Navigate to={`/clinica/usuarios/${user.id}/editar`} replace />;
    }

    if (!can.manageUsers(role) && String(user.id) !== userId) {
        return <Navigate to={`/clinica/usuarios/${user.id}/editar`} replace />;
    }

    return children;
}
