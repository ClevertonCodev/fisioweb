import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DsPatientNavbar, type DsPatientNavbarProps } from '@/components/ds';

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
    user: null as { name: string; email?: string } | null,
    isLoading: false,
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        ...mockAuthState,
        logout: mockLogout,
    }),
}));

function renderNavbar(props: DsPatientNavbarProps = {}, initialPath = '/clinica-cleverton/paciente/login') {
    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <MemoryRouter initialEntries={[initialPath]}>
                <Routes>
                    <Route
                        path="/:clinicSlug/paciente/login"
                        element={children}
                    />
                    <Route
                        path="/:clinicSlug/paciente/programas"
                        element={children}
                    />
                    <Route path="/paciente/login" element={children} />
                </Routes>
            </MemoryRouter>
        );
    }

    return render(<DsPatientNavbar {...props} />, { wrapper: Wrapper });
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

describe('DsPatientNavbar', () => {
    it('mostra o logo oficial e a marca IVS Fisioterapia e Saúde', () => {
        renderNavbar();

        expect(screen.getByText('IVS')).toBeInTheDocument();
        expect(screen.getByText(/Fisioterapia e Saúde/i)).toBeInTheDocument();
    });

    it('inclui o botão de tema escuro/claro do DS', () => {
        renderNavbar();

        expect(
            screen.getByRole('button', { name: /Ativar tema/i }),
        ).toBeInTheDocument();
    });

    it('em modo anônimo sem hideAuthAction, exibe botão Entrar', () => {
        renderNavbar({ hideAuthAction: false });

        expect(
            screen.getByRole('button', { name: /Entrar/i }),
        ).toBeInTheDocument();
    });

    it('com hideAuthAction=true, oculta o botão Entrar', () => {
        renderNavbar({ hideAuthAction: true });

        expect(
            screen.queryByRole('button', { name: /Entrar/i }),
        ).not.toBeInTheDocument();
    });

    it('com paciente autenticado, exibe nome e botão Sair', async () => {
        const user = userEvent.setup();
        mockAuthState = {
            isAuthenticated: true,
            guard: 'patient',
            user: { name: 'Maria Silva' },
            isLoading: false,
        };

        renderNavbar();

        expect(screen.getByText('Maria')).toBeInTheDocument();
        const logoutBtn = screen.getByRole('button', { name: /Sair/i });
        expect(logoutBtn).toBeInTheDocument();

        await user.click(logoutBtn);
        expect(mockLogout).toHaveBeenCalledWith('patient');
    });

    it('em modo contextual, exibe título e botão Voltar', async () => {
        const user = userEvent.setup();
        const onBack = vi.fn();

        renderNavbar({
            title: 'Exercício 1: Alongamento',
            current: 1,
            total: 5,
            onBack,
        });

        expect(screen.getByText('Exercício 1: Alongamento')).toBeInTheDocument();
        expect(screen.getByText('1/5')).toBeInTheDocument();

        const backBtn = screen.getByRole('button', { name: /Voltar/i });
        await user.click(backBtn);
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
