import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { completeClinicFirstAccess } from '@/infrastructure/api/auth.service';

vi.mock('@/infrastructure/api/auth.service', async (importOriginal) => ({
    ...(await importOriginal<
        typeof import('@/infrastructure/api/auth.service')
    >()),
    completeClinicFirstAccess: vi.fn(),
}));

const mockComplete = vi.mocked(completeClinicFirstAccess);

const input = {
    token: 'abc123',
    password: 'senhaDoMestre1',
    passwordConfirmation: 'senhaDoMestre1',
};

function Probe() {
    const { isAuthenticated, guard, user, completeFirstAccess } = useAuth();
    const [failed, setFailed] = useState(false);
    return (
        <>
            <button
                onClick={() =>
                    completeFirstAccess(input).catch(() => setFailed(true))
                }
            >
                Concluir
            </button>
            <p>
                {isAuthenticated
                    ? `${guard}:${user?.id}:${user?.clinicId}:${user?.mestre}`
                    : 'sem sessão'}
            </p>
            {failed && <p>recusado</p>}
        </>
    );
}

function renderProbe() {
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>,
    );
}

describe('AuthContext.completeFirstAccess', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    it('abre a sessão da clínica com o usuário que a API devolveu', async () => {
        mockComplete.mockResolvedValueOnce({
            access_token: 'a.b.c',
            token_type: 'bearer',
            expires_in: 3600,
            user: {
                id: 13,
                name: 'Mestre',
                email: 'mestre@clinica.test',
                clinic_id: 5,
                mestre: 1,
                role: 'admin',
            },
        });
        renderProbe();
        expect(screen.getByText('sem sessão')).toBeInTheDocument();

        await userEvent.click(screen.getByRole('button', { name: 'Concluir' }));

        expect(await screen.findByText('clinic:13:5:1')).toBeInTheDocument();
        expect(mockComplete).toHaveBeenCalledWith(input);
    });

    it('continua sem sessão quando o link é recusado', async () => {
        mockComplete.mockRejectedValueOnce({
            response: { status: 422, data: { message: 'Link inválido.' } },
        });
        renderProbe();

        await userEvent.click(screen.getByRole('button', { name: 'Concluir' }));

        expect(await screen.findByText('recusado')).toBeInTheDocument();
        expect(screen.getByText('sem sessão')).toBeInTheDocument();
    });
});
