import { apiClient, clearStoredAuth, setStoredAuth } from './client';

export type AuthGuard = 'admin' | 'clinic';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: {
        id: number;
        name: string;
        email: string;
        [key: string]: unknown;
    };
}

export async function login(
    guard: AuthGuard,
    credentials: LoginCredentials,
): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>(`/${guard}/auth/login`, credentials);
    setStoredAuth(data.access_token, guard);
    return data;
}

export async function logout(guard: AuthGuard): Promise<void> {
    try {
        await apiClient.post(`/${guard}/auth/logout`);
    } finally {
        clearStoredAuth(guard);
    }
}

export interface RefreshResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: { id: number; name: string; email: string; [key: string]: unknown };
}

export async function refresh(guard: AuthGuard): Promise<RefreshResponse> {
    const { data } = await apiClient.post<RefreshResponse>(`/${guard}/auth/refresh`);
    setStoredAuth(data.access_token, guard);
    return data;
}

export function decodeJwtExp(token: string): number | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
        const decoded = JSON.parse(atob(padded)) as Record<string, unknown>;
        if (typeof decoded.exp !== 'number') return null;
        return decoded.exp; // Unix timestamp em segundos
    } catch {
        return null;
    }
}

export async function forgotPassword(guard: AuthGuard, email: string): Promise<void> {
    await apiClient.post(`/${guard}/auth/forgot-password`, { email });
}

export async function resetPassword(
    guard: AuthGuard,
    token: string,
    email: string,
    password: string,
    password_confirmation: string,
): Promise<void> {
    await apiClient.post(`/${guard}/auth/reset-password`, {
        token,
        email,
        password,
        password_confirmation,
    });
}
