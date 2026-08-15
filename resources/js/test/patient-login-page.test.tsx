import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PatientLoginPage from '@/pages/patient/auth/PatientLoginPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<typeof import('react-router-dom')>(
            'react-router-dom',
        );
    return { ...actual, useNavigate: () => mockNavigate };
});

const mockFindClinics = vi.fn();
const mockLogin = vi.fn();

vi.mock('@/infrastructure/repositories/api-patient-auth', () => ({
    apiPatientAuthRepository: {
        findClinics: (identifier: string) => mockFindClinics(identifier),
        login: (credentials: unknown) => mockLogin(credentials),
    },
}));

const mockSetUser = vi.fn();
let mockAuthState = {
    isAuthenticated: false,
    guard: null as string | null,
    user: null as { name: string; email: string } | null,
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        ...mockAuthState,
        setUser: mockSetUser,
        logout: vi.fn(),
    }),
}));

function renderAt(path: string, routePattern: string) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    function Wrapper({ children }: { children: ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route path={routePattern} element={children} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
    }

    return render(<PatientLoginPage />, { wrapper: Wrapper });
}

beforeEach(() => {
    mockAuthState = { isAuthenticated: false, guard: null, user: null };
});

afterEach(() => {
    vi.clearAllMocks();
});

// ───────────────────────────────────────────────────────── US1 (contextual)

describe('US1 — login com clínica fixada pelo slug', () => {
    it('mostra a clínica do contexto e pede senha direto', () => {
        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        expect(screen.getByLabelText(/CPF ou e-mail/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Senha$/i)).toBeInTheDocument();
        expect(screen.getByText(/clinica cleverton/i)).toBeInTheDocument();
    });

    it('envia o slug da URL como clinicSlug, sem clinicId vazio', async () => {
        // Regressão: a página mandava clinicId '' e o repositório convertia
        // para clinic_id 0, derrubando todo login vindo de deep link.
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            accessToken: 't',
            user: { id: '31', name: 'Norris', email: 'n@x.com', clinicId: '1' },
        });

        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '04960000889');
        await user.type(screen.getByLabelText(/^Senha$/i), '04960000889');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith({
                identifier: '04960000889',
                password: '04960000889',
                clinicId: null,
                clinicSlug: 'clinica-cleverton',
            });
        });
    });

    it('valida o formato do identificador antes de enviar', async () => {
        const user = userEvent.setup();
        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '123');
        await user.type(screen.getByLabelText(/^Senha$/i), 'senha');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        expect(
            await screen.findByText(/11 dígitos ou um e-mail válido/i),
        ).toBeInTheDocument();
        expect(mockLogin).not.toHaveBeenCalled();
    });

    it('exibe mensagem genérica quando a credencial falha', async () => {
        const user = userEvent.setup();
        mockLogin.mockRejectedValueOnce({ response: { status: 401 } });

        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.type(screen.getByLabelText(/^Senha$/i), 'errada');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        expect(
            await screen.findByText(/Não encontramos essa combinação/i),
        ).toBeInTheDocument();
    });

    it('mostra mensagem própria no 429', async () => {
        const user = userEvent.setup();
        mockLogin.mockRejectedValueOnce({
            response: {
                status: 429,
                data: { message: 'Muitas tentativas. Aguarde 60 segundos.' },
            },
        });

        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.type(screen.getByLabelText(/^Senha$/i), 'errada');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        expect(
            await screen.findByText(/Muitas tentativas/i),
        ).toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────────────────── US2 (descoberta)

describe('US2 — login sem contexto de clínica', () => {
    it('pede só o identificador no primeiro passo', () => {
        renderAt('/paciente/login', '/paciente/login');

        expect(screen.getByLabelText(/CPF ou e-mail/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/^Senha$/i)).not.toBeInTheDocument();
    });

    it('lista as clínicas quando há mais de uma', async () => {
        const user = userEvent.setup();
        mockFindClinics.mockResolvedValueOnce([
            { id: '1', name: 'Clínica Cleverton', slug: 'clinica-cleverton' },
            { id: '2', name: 'Fisio Centro', slug: null },
        ]);

        renderAt('/paciente/login', '/paciente/login');

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.click(screen.getByRole('button', { name: /Continuar/i }));

        expect(
            await screen.findByText('Clínica Cleverton'),
        ).toBeInTheDocument();
        expect(screen.getByText('Fisio Centro')).toBeInTheDocument();
    });

    it('pula a escolha quando há exatamente uma clínica', async () => {
        const user = userEvent.setup();
        mockFindClinics.mockResolvedValueOnce([
            { id: '1', name: 'Clínica Cleverton', slug: 'clinica-cleverton' },
        ]);

        renderAt('/paciente/login', '/paciente/login');

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.click(screen.getByRole('button', { name: /Continuar/i }));

        expect(await screen.findByLabelText(/^Senha$/i)).toBeInTheDocument();
    });

    it('preserva o identificador ao voltar da escolha de clínica', async () => {
        const user = userEvent.setup();
        mockFindClinics.mockResolvedValueOnce([
            { id: '1', name: 'Clínica A', slug: 'a' },
            { id: '2', name: 'Clínica B', slug: 'b' },
        ]);

        renderAt('/paciente/login', '/paciente/login');

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.click(screen.getByRole('button', { name: /Continuar/i }));

        await screen.findByText('Clínica A');
        await user.click(screen.getByRole('button', { name: /Voltar/i }));

        expect(screen.getByLabelText(/CPF ou e-mail/i)).toHaveValue(
            '12345678900',
        );
    });

    it('usa a mensagem genérica quando a lista volta vazia', async () => {
        const user = userEvent.setup();
        mockFindClinics.mockResolvedValueOnce([]);

        renderAt('/paciente/login', '/paciente/login');

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '00000000000');
        await user.click(screen.getByRole('button', { name: /Continuar/i }));

        expect(
            await screen.findByText(/Não encontramos essa combinação/i),
        ).toBeInTheDocument();
    });
});

// ──────────────────────────────────────────────────────────────── US3 (next)

describe('US3 — destino após o login', () => {
    it('volta ao programa de origem quando o next é seguro', async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            accessToken: 't',
            user: { id: '1', name: 'Maria', email: 'm@x.com', clinicId: '1' },
        });

        renderAt(
            '/clinica-cleverton/paciente/login?next=%2Fclinica-cleverton%2Fpaciente%2Fprogramas%2Fabc',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.type(screen.getByLabelText(/^Senha$/i), '12345678900');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                '/clinica-cleverton/paciente/programas/abc',
                { replace: true },
            );
        });
    });

    it('descarta next externo e cai na lista de programas', async () => {
        const user = userEvent.setup();
        mockLogin.mockResolvedValueOnce({
            accessToken: 't',
            user: { id: '1', name: 'Maria', email: 'm@x.com', clinicId: '1' },
        });

        renderAt(
            '/clinica-cleverton/paciente/login?next=https%3A%2F%2Fsite-falso.com',
            '/:clinicSlug/paciente/login',
        );

        await user.type(screen.getByLabelText(/CPF ou e-mail/i), '12345678900');
        await user.type(screen.getByLabelText(/^Senha$/i), '12345678900');
        await user.click(screen.getByRole('button', { name: /^Entrar$/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                '/clinica-cleverton/paciente/programas',
                { replace: true },
            );
        });
    });

    it('redireciona quem já está autenticado em vez de mostrar o formulário', async () => {
        mockAuthState = {
            isAuthenticated: true,
            guard: 'patient',
            user: { name: 'Maria', email: 'm@x.com' },
        };

        renderAt(
            '/clinica-cleverton/paciente/login',
            '/:clinicSlug/paciente/login',
        );

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith(
                '/clinica-cleverton/paciente/programas',
                { replace: true },
            );
        });
    });
});
