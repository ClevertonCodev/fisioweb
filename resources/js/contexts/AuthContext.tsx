import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { toast } from 'sonner';

import type { User } from '@/domain/auth';
import type { AuthGuard } from '@/infrastructure/api/auth.service';
import {
    login as apiLogin,
    logout as apiLogout,
    refresh as apiRefresh,
    decodeJwtExp,
    type LoginCredentials,
} from '@/infrastructure/api/auth.service';
import {
    apiClient,
    clearStoredAuth,
    getStoredAuth,
} from '@/infrastructure/api/client';

const WARN_BEFORE_MS = 5 * 60 * 1000; // 5 minutos antes de expirar

interface AuthState {
    user: User | null;
    guard: AuthGuard | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

interface AuthContextValue extends AuthState {
    login: (guard: AuthGuard, credentials: LoginCredentials) => Promise<void>;
    logout: (guard: AuthGuard) => Promise<void>;
    setUser: (user: User | null, guard: AuthGuard | null) => void;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(raw: {
    id: number;
    name: string;
    email: string;
    role?: string;
    photo_url?: string | null;
    clinic_id?: number;
    mestre?: number;
}): User {
    return {
        id: raw.id,
        name: raw.name,
        email: raw.email,
        role: raw.role as User['role'],
        photoUrl: raw.photo_url ?? undefined,
        clinicId: raw.clinic_id,
        mestre: raw.mestre === 1 ? 1 : 0,
    };
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        guard: null,
        isAuthenticated: false,
        isLoading: true,
    });

    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshSessionRef = useRef<() => Promise<void>>(() =>
        Promise.resolve(),
    );

    const scheduleExpiryWarning = useCallback((token: string) => {
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);

        const exp = decodeJwtExp(token);
        if (!exp) return;

        const delay = exp * 1000 - Date.now() - WARN_BEFORE_MS;

        const fire = () =>
            toast.warning('Sua sessão expira em 5 minutos.', {
                id: 'session-expiry-warning',
                duration: Infinity,
                action: {
                    label: 'Renovar',
                    onClick: () => void refreshSessionRef.current(),
                },
            });

        if (delay <= 0) {
            fire();
            return;
        }

        expiryTimerRef.current = setTimeout(fire, delay);
    }, []);

    const setUser = useCallback(
        (user: User | null, guard: AuthGuard | null) => {
            setState({
                user,
                guard,
                isAuthenticated: !!user && !!guard,
                isLoading: false,
            });
        },
        [],
    );

    const login = useCallback(
        async (guard: AuthGuard, credentials: LoginCredentials) => {
            const res = await apiLogin(guard, credentials);
            setState({
                user: normalizeUser(res.user),
                guard,
                isAuthenticated: true,
                isLoading: false,
            });
            scheduleExpiryWarning(res.access_token);
        },
        [scheduleExpiryWarning],
    );

    const logout = useCallback(async (guard: AuthGuard) => {
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        toast.dismiss('session-expiry-warning');
        await apiLogout(guard);
        setState({
            user: null,
            guard: null,
            isAuthenticated: false,
            isLoading: false,
        });
    }, []);

    const refreshSession = useCallback(async () => {
        const auth = getStoredAuth(state.guard ?? undefined);
        if (!auth) return;
        try {
            const res = await apiRefresh(auth.guard);
            toast.dismiss('session-expiry-warning');
            scheduleExpiryWarning(res.access_token);
        } catch {
            toast.error(
                'Não foi possível renovar a sessão. Faça login novamente.',
            );
            if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
            clearStoredAuth(auth.guard);
            setState({
                user: null,
                guard: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    }, [state.guard, scheduleExpiryWarning]);

    // Manter ref sempre atualizada para uso dentro do toast
    useEffect(() => {
        refreshSessionRef.current = refreshSession;
    }, [refreshSession]);

    // Limpar timer no unmount
    useEffect(() => {
        return () => {
            if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        };
    }, []);

    // Restore session from localStorage on mount
    useEffect(() => {
        const auth = getStoredAuth();
        if (!auth) {
            setState((s) => ({ ...s, isLoading: false }));
            return;
        }
        apiClient
            .get<{
                id: number;
                name: string;
                email: string;
                role?: string;
                photo_url?: string | null;
                clinic_id?: number;
                mestre?: number;
            }>(`/${auth.guard}/auth/me`)
            .then(({ data }) => {
                setState({
                    user: normalizeUser(data),
                    guard: auth.guard as AuthGuard,
                    isAuthenticated: true,
                    isLoading: false,
                });
                scheduleExpiryWarning(auth.token);
            })
            .catch(() => {
                clearStoredAuth(auth.guard as AuthGuard);
                setState({
                    user: null,
                    guard: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            });
    }, [scheduleExpiryWarning]);

    const value = useMemo<AuthContextValue>(
        () => ({
            ...state,
            login,
            logout,
            setUser,
            refreshSession,
        }),
        [state, login, logout, setUser, refreshSession],
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
