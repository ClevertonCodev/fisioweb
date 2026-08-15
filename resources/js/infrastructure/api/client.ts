import axios from 'axios';

import { refresh, type AuthGuard } from './auth.service';

const AUTH_GUARD_KEY = 'auth_guard';
const PATIENT_CLINIC_SLUG_KEY = 'patient_clinic_slug';
const tokenKey = (guard: AuthGuard) => `auth_token_${guard}`;

export function getPatientClinicSlug(): string | null {
    return localStorage.getItem(PATIENT_CLINIC_SLUG_KEY);
}

export function setPatientClinicSlug(slug: string): void {
    localStorage.setItem(PATIENT_CLINIC_SLUG_KEY, slug);
}

export function clearPatientClinicSlug(): void {
    localStorage.removeItem(PATIENT_CLINIC_SLUG_KEY);
}

const SESSION_TOKEN_KEY = 'auth_token';
const SESSION_GUARD_KEY = 'auth_guard';

function inferGuardFromApiUrl(url?: string): AuthGuard | null {
    if (!url) return null;
    if (url.startsWith('/admin/') || url === '/admin') return 'admin';
    if (url.startsWith('/clinic/') || url === '/clinic') return 'clinic';
    if (url.startsWith('/patient/') || url === '/patient') return 'patient';
    return null;
}

function isPublicPatientRequest(url?: string): boolean {
    if (!url) return false;

    if (url.startsWith('/patient/auth/')) return true;

    if (/^\/patient\/programs\/[^/]+/.test(url)) return true;

    return false;
}

export function isPatientAreaPath(path: string): boolean {
    return path.startsWith('/paciente') || path.includes('/paciente/');
}

function inferGuardFromPath(path: string): AuthGuard | null {
    if (path.startsWith('/admin')) return 'admin';
    if (isPatientAreaPath(path)) return 'patient';
    if (path.startsWith('/clinica')) return 'clinic';
    return null;
}

export function getStoredAuthForPage(): { token: string; guard: AuthGuard } | null {
    if (isPatientAreaPath(window.location.pathname)) {
        return getStoredAuth('patient') ?? getStoredAuth();
    }

    return getStoredAuth();
}

function migrateOldAuthKeys(): void {
    const oldToken = localStorage.getItem('auth_token');
    const oldGuard = localStorage.getItem('auth_guard');
    if (oldToken && (oldGuard === 'admin' || oldGuard === 'clinic')) {
        localStorage.setItem(tokenKey(oldGuard as AuthGuard), oldToken);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_guard');
    }
}

export function getStoredAuth(
    guard?: AuthGuard,
): { token: string; guard: AuthGuard } | null {
    const sessionToken = sessionStorage.getItem(SESSION_TOKEN_KEY);
    const sessionGuard = sessionStorage.getItem(
        SESSION_GUARD_KEY,
    ) as AuthGuard | null;
    if (sessionToken && sessionGuard) {
        if (!guard || sessionGuard === guard)
            return { token: sessionToken, guard: sessionGuard };
    }

    migrateOldAuthKeys();

    if (guard) {
        const token = localStorage.getItem(tokenKey(guard));
        if (!token) return null;
        return { token, guard };
    }

    const pathGuard = inferGuardFromPath(window.location.pathname);
    if (pathGuard) {
        const token = localStorage.getItem(tokenKey(pathGuard));
        if (token) return { token, guard: pathGuard };
    }

    for (const g of ['admin', 'clinic', 'patient'] as AuthGuard[]) {
        const token = localStorage.getItem(tokenKey(g));
        if (token) return { token, guard: g };
    }

    return null;
}

export function setStoredAuth(token: string, guard: AuthGuard): void {
    localStorage.setItem(tokenKey(guard), token);
    localStorage.setItem(AUTH_GUARD_KEY, guard);
}

export function setSessionAuth(token: string, guard: string): void {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_GUARD_KEY, guard);
}

export function clearStoredAuth(guard?: AuthGuard): void {
    if (guard) {
        localStorage.removeItem(tokenKey(guard));
        if (guard === 'patient') {
            clearPatientClinicSlug();
        }
        if (localStorage.getItem(AUTH_GUARD_KEY) === guard) {
            localStorage.removeItem(AUTH_GUARD_KEY);
        }
        const sessionGuard = sessionStorage.getItem(SESSION_GUARD_KEY);
        if (sessionGuard === guard) {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
            sessionStorage.removeItem(SESSION_GUARD_KEY);
        }
    } else {
        localStorage.removeItem(tokenKey('admin'));
        localStorage.removeItem(tokenKey('clinic'));
        localStorage.removeItem(tokenKey('patient'));
        localStorage.removeItem(AUTH_GUARD_KEY);
        clearPatientClinicSlug();
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_GUARD_KEY);
    }
}

function redirectToLogin(guard: AuthGuard): void {
    if (guard === 'admin') {
        window.location.href = '/admin/login';
        return;
    }
    if (guard === 'clinic') {
        window.location.href = '/clinica/login';
        return;
    }

    const path = window.location.pathname;
    const slugMatch = path.match(/^\/([^/]+)\/paciente(?:\/|$)/);
    const base = slugMatch ? `/${slugMatch[1]}/paciente/login` : '/paciente/login';
    const next = encodeURIComponent(`${path}${window.location.search}`);

    window.location.href = `${base}?next=${next}`;
}

export const apiClient = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
    const guard = inferGuardFromApiUrl(config.url);
    const auth = guard ? getStoredAuth(guard) : getStoredAuth();
    if (auth?.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        const urlGuard = inferGuardFromApiUrl(originalRequest.url);

        const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');
        if (isRefreshRequest) {
            const guard = urlGuard ?? getStoredAuth()?.guard ?? 'clinic';
            clearStoredAuth(guard as AuthGuard);
            redirectToLogin(guard as AuthGuard);
            return Promise.reject(error);
        }

        const auth = urlGuard ? getStoredAuth(urlGuard) : getStoredAuth();
        if (!auth) {
            if (urlGuard === 'patient' && isPublicPatientRequest(originalRequest.url)) {
                return Promise.reject(error);
            }
            redirectToLogin(urlGuard ?? 'clinic');
            return Promise.reject(error);
        }

        try {
            const data = await refresh(auth.guard);
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return apiClient(originalRequest);
        } catch {
            clearStoredAuth(auth.guard);
            redirectToLogin(auth.guard);
            return Promise.reject(error);
        }
    },
);
