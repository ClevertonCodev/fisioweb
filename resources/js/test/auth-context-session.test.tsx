import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { completeClinicFirstAccess } from '@/infrastructure/api/auth.service';
import {
    apiClient,
    replaceStoredToken,
    setSessionAuth,
} from '@/infrastructure/api/client';

vi.mock('@/infrastructure/api/auth.service', async (importOriginal) => ({
    ...(await importOriginal<
        typeof import('@/infrastructure/api/auth.service')
    >()),
    completeClinicFirstAccess: vi.fn(),
}));

vi.mock('sonner', () => ({
    toast: { warning: vi.fn(), dismiss: vi.fn(), error: vi.fn() },
}));

const mockComplete = vi.mocked(completeClinicFirstAccess);

const me = {
    id: 13,
    name: 'Mestre',
    email: 'mestre@clinica.test',
    clinic_id: 5,
    mestre: 1,
    role: 'admin',
};

function tokenExpiringIn(minutes: number): string {
    const exp = Math.floor(Date.now() / 1000) + minutes * 60;
    return `x.${btoa(JSON.stringify({ exp }))}.y`;
}

function Probe() {
    const { completeFirstAccess, isImpersonating, isAuthenticated } = useAuth();
    return (
        <>
            <button
                onClick={() =>
                    void completeFirstAccess({
                        token: 't',
                        password: 'senhaDoMestre1',
                        passwordConfirmation: 'senhaDoMestre1',
                    })
                }
            >
                Entrar
            </button>
            <p>{isAuthenticated ? 'logado' : 'sem sessão'}</p>
            <p>{isImpersonating ? 'entrar como' : 'sessão própria'}</p>
        </>
    );
}

async function signIn(
    token: string,
    user = userEvent.setup({
        advanceTimers: (ms) => {
            if (vi.isFakeTimers()) vi.advanceTimersByTime(ms);
        },
    }),
) {
    mockComplete.mockResolvedValueOnce({
        access_token: token,
        token_type: 'bearer',
        expires_in: 600,
        user: me,
    });
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText('logado');
}

describe('AuthContext · sessão', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('o aviso de sessão expirando segue o token novo depois da troca da própria senha', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        await signIn(tokenExpiringIn(10));

        act(() => replaceStoredToken(tokenExpiringIn(60), 'clinic'));
        act(() => vi.advanceTimersByTime(6 * 60 * 1000));

        expect(toast.warning).not.toHaveBeenCalled();
    });

    it('sem troca de token, o aviso aparece no vencimento do token do login', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        await signIn(tokenExpiringIn(10));

        act(() => vi.advanceTimersByTime(6 * 60 * 1000));

        expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('diz quando a aba está no "entrar como"', async () => {
        await signIn(tokenExpiringIn(60));
        expect(screen.getByText('sessão própria')).toBeInTheDocument();
    });

    it('reconhece a sessão da aba aberta pelo "entrar como"', async () => {
        setSessionAuth(tokenExpiringIn(60), 'clinic');
        vi.spyOn(apiClient, 'get').mockResolvedValueOnce({ data: me });

        render(
            <AuthProvider>
                <Probe />
            </AuthProvider>,
        );

        expect(await screen.findByText('logado')).toBeInTheDocument();
        expect(screen.getByText('entrar como')).toBeInTheDocument();
    });
});
