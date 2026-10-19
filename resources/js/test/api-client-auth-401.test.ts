import type { AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
    apiClient,
    clearStoredAuth,
    setStoredAuth,
} from '@/infrastructure/api/client';

/** Adapter que responde 401 a tudo e guarda as URLs chamadas. */
function unauthorizedAdapter(calls: string[]): AxiosAdapter {
    return (config) => {
        calls.push(config.url ?? '');
        return Promise.reject({
            config,
            response: {
                status: 401,
                data: { message: 'Credenciais inválidas.' },
            },
            isAxiosError: true,
        });
    };
}

describe('apiClient: 401 nas rotas de autenticação', () => {
    const originalAdapter = apiClient.defaults.adapter;
    const originalLocation = window.location;
    let calls: string[];

    beforeEach(() => {
        calls = [];
        apiClient.defaults.adapter = unauthorizedAdapter(calls);
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: 'http://localhost/clinica/login' },
        });
    });

    afterEach(() => {
        apiClient.defaults.adapter = originalAdapter;
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: originalLocation,
        });
        clearStoredAuth('clinic');
    });

    it('senha errada sem sessão: devolve o erro e não recarrega a página', async () => {
        await expect(
            apiClient.post('/clinic/auth/login', {
                email: 'a@b.c',
                password: 'x',
            }),
        ).rejects.toMatchObject({
            response: { data: { message: 'Credenciais inválidas.' } },
        });
        expect(window.location.href).toBe('http://localhost/clinica/login');
        expect(calls).toEqual(['/clinic/auth/login']);
    });

    it('senha errada com sessão aberta: não tenta renovar o token', async () => {
        setStoredAuth('token-antigo', 'clinic');
        await expect(
            apiClient.post('/clinic/auth/login', {
                email: 'a@b.c',
                password: 'x',
            }),
        ).rejects.toBeTruthy();
        expect(calls).toEqual(['/clinic/auth/login']);
    });

    it('recuperar e redefinir senha também não redirecionam', async () => {
        await expect(
            apiClient.post('/clinic/auth/forgot-password', { email: 'a@b.c' }),
        ).rejects.toBeTruthy();
        await expect(
            apiClient.post('/clinic/auth/reset-password', {}),
        ).rejects.toBeTruthy();
        expect(window.location.href).toBe('http://localhost/clinica/login');
    });

    it('em outra rota, 401 sem sessão continua levando ao login', async () => {
        window.location.href = 'http://localhost/clinica/pacientes';
        await expect(apiClient.get('/clinic/patients')).rejects.toBeTruthy();
        expect(window.location.href).toBe('/clinica/login');
    });
});
