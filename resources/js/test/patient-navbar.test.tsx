import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PatientNavbar } from '@/components/PatientNavbar';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<typeof import('react-router-dom')>(
            'react-router-dom',
        );
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogout = vi.fn().mockResolvedValue(undefined);
let mockAuthState = {
    isAuthenticated: false,
    guard: null as string | null,
    user: null as { name: string; email: string } | null,
    isLoading: false,
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        ...mockAuthState,
        setUser: vi.fn(),
        logout: mockLogout,
        refreshSession: vi.fn(),
        login: vi.fn(),
    }),
}));

function renderNavbar(
    path = '/clinica-cleverton/paciente/programas',
    pattern = '/:clinicSlug/paciente/programas',
    props = {},
) {
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route path={pattern} element={children} />
                </Routes>
            </MemoryRouter>
        );
    }

    return render(<PatientNavbar {...props} />, { wrapper: Wrapper });
}

beforeEach(() => {
    mockAuthState = {
        isAuthenticated: false,
        guard: null,
        user: null,
        isLoading: false,
    };
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('PatientNavbar — visitante anônimo', () => {
    it('oferece a ação Entrar', () => {
        renderNavbar();
        expect(
            screen.getByRole('button', { name: /Entrar/i }),
        ).toBeInTheDocument();
    });

    it('leva ao login do paciente registrando o destino de retorno', async () => {
        const user = userEvent.setup();
        renderNavbar(
            '/clinica-cleverton/paciente/programas/abc',
            '/:clinicSlug/paciente/programas/:token',
        );

        await user.click(screen.getByRole('button', { name: /Entrar/i }));

        expect(mockNavigate).toHaveBeenCalledWith(
            '/clinica-cleverton/paciente/login?next=%2Fclinica-cleverton%2Fpaciente%2Fprogramas%2Fabc',
        );
    });
});

describe('PatientNavbar — paciente autenticado', () => {
    beforeEach(() => {
        mockAuthState = {
            isAuthenticated: true,
            guard: 'patient',
            user: { name: 'Maria Silva', email: 'maria@exemplo.com' },
            isLoading: false,
        };
    });

    it('substitui Entrar pela identificação do paciente', () => {
        renderNavbar();

        expect(
            screen.queryByRole('button', { name: /^Entrar$/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Menu do paciente/i }),
        ).toBeInTheDocument();
    });

    it('permite sair e volta ao estado anônimo', async () => {
        const user = userEvent.setup();
        renderNavbar();

        await user.click(
            screen.getByRole('button', { name: /Menu do paciente/i }),
        );

        const sair = await screen.findByRole('button', { name: /Sair/i });
        await user.click(sair);

        await waitFor(() => {
            expect(mockLogout).toHaveBeenCalledWith('patient');
        });
    });

    it('não mostra sessão de clínica como se fosse paciente', () => {
        mockAuthState = {
            isAuthenticated: true,
            guard: 'clinic',
            user: { name: 'Dra. Ana', email: 'ana@clinica.com' },
            isLoading: false,
        };

        renderNavbar();

        expect(
            screen.getByRole('button', { name: /Entrar/i }),
        ).toBeInTheDocument();
    });

    it('não mostra Entrar enquanto restaura sessão do paciente', () => {
        mockAuthState = {
            isAuthenticated: false,
            guard: null,
            user: null,
            isLoading: true,
        };

        renderNavbar();

        expect(
            screen.queryByRole('button', { name: /Entrar/i }),
        ).not.toBeInTheDocument();
    });

    it('volta à lista ao clicar no logo fora da listagem', async () => {
        const user = userEvent.setup();
        renderNavbar(
            '/clinica-cleverton/paciente/programas/abc',
            '/:clinicSlug/paciente/programas/:token',
        );

        await user.click(
            screen.getByRole('button', { name: /Ir para meus programas/i }),
        );

        expect(mockNavigate).toHaveBeenCalledWith(
            '/clinica-cleverton/paciente/programas',
        );
    });
});

describe('PatientNavbar — hideAuthAction', () => {
    it('omite a ação de autenticação na tela de login', () => {
        renderNavbar(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
            { hideAuthAction: true },
        );

        expect(
            screen.queryByRole('button', { name: /Entrar/i }),
        ).not.toBeInTheDocument();
    });
});
