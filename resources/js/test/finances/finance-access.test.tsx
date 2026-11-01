import { render, screen } from '@testing-library/react';
import {
    createMemoryRouter,
    MemoryRouter,
    Route,
    RouterProvider,
    Routes,
} from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClinicSidebar } from '@/components/clinic/ClinicSidebar';
import { RequireFinanceAccess } from '@/components/clinic/RequireFinanceAccess';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ClinicRole } from '@/domain/auth/session';
import { financeRoutes } from '@/routes/clinic/finance-routes';
import { routerFutureFlags } from '@/test/browser-router';

const authState: {
    user: { id: number; name: string; role: ClinicRole; clinicId: number };
    isLoading: boolean;
    logout: () => Promise<void>;
} = {
    user: { id: 1, name: 'Ana Admin', role: 'admin', clinicId: 10 },
    isLoading: false,
    logout: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

vi.mock('@/pages/clinic/finances/FinancesPage', () => ({
    default: () => <p>Tela de Finanças</p>,
}));
vi.mock('@/pages/clinic/finances/FinancesTrashPage', () => ({
    default: () => <p>Tela de Finanças</p>,
}));
vi.mock('@/pages/clinic/finances/FinancesCategoriesPage', () => ({
    default: () => <p>Tela de Finanças</p>,
}));

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

beforeEach(() => {
    authState.isLoading = false;
});

function asRole(role: ClinicRole) {
    authState.user = { id: 1, name: 'Pessoa', role, clinicId: 10 };
}

function renderFinanceRoute(path = '/clinica/financas') {
    return render(
        <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
            <Routes>
                <Route path="/clinica" element={<p>Início da clínica</p>} />
                <Route
                    path="/clinica/financas"
                    element={
                        <RequireFinanceAccess>
                            <p>Tela de Finanças</p>
                        </RequireFinanceAccess>
                    }
                />
            </Routes>
        </MemoryRouter>,
    );
}

function renderSidebar() {
    return render(
        <MemoryRouter initialEntries={['/clinica']} future={routerFutureFlags}>
            <TooltipProvider>
                <ClinicSidebar />
            </TooltipProvider>
        </MemoryRouter>,
    );
}

describe('RequireFinanceAccess', () => {
    it.each<ClinicRole>(['admin', 'secretary'])(
        'abre Finanças para %s',
        (role) => {
            asRole(role);
            renderFinanceRoute();

            expect(screen.getByText('Tela de Finanças')).toBeInTheDocument();
        },
    );

    it('manda o fisioterapeuta para o início da clínica', () => {
        asRole('physiotherapist');
        renderFinanceRoute();

        expect(screen.queryByText('Tela de Finanças')).not.toBeInTheDocument();
        expect(screen.getByText('Início da clínica')).toBeInTheDocument();
    });

    it('não decide nada enquanto a sessão carrega', () => {
        asRole('physiotherapist');
        authState.isLoading = true;
        renderFinanceRoute();

        expect(screen.queryByText('Tela de Finanças')).not.toBeInTheDocument();
        expect(screen.queryByText('Início da clínica')).not.toBeInTheDocument();
    });
});

describe('rotas de Finanças', () => {
    const paths = [
        '/clinica/financas',
        '/clinica/financas/lixeira',
        '/clinica/financas/categorias',
    ];

    function renderRealRoute(path: string) {
        const router = createMemoryRouter(
            [
                { path: '/clinica', element: <p>Início da clínica</p> },
                ...financeRoutes,
            ],
            { initialEntries: [path] },
        );
        return render(<RouterProvider router={router} />);
    }

    it.each(paths)('a secretária abre %s', (path) => {
        asRole('secretary');
        renderRealRoute(path);

        expect(screen.getByText('Tela de Finanças')).toBeInTheDocument();
    });

    it.each(paths)('o fisioterapeuta não abre %s', (path) => {
        asRole('physiotherapist');
        renderRealRoute(path);

        expect(screen.queryByText('Tela de Finanças')).not.toBeInTheDocument();
        expect(screen.getByText('Início da clínica')).toBeInTheDocument();
    });
});

describe('ClinicSidebar', () => {
    it('mostra Finanças e Usuários para o admin', () => {
        asRole('admin');
        renderSidebar();

        expect(
            screen.getByRole('link', { name: /Finanças/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Usuários/ }),
        ).toBeInTheDocument();
    });

    it('mostra Finanças e esconde Usuários para a secretária', () => {
        asRole('secretary');
        renderSidebar();

        expect(
            screen.getByRole('link', { name: /Finanças/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /Usuários/ }),
        ).not.toBeInTheDocument();
    });

    it('esconde Finanças e Usuários do fisioterapeuta', () => {
        asRole('physiotherapist');
        renderSidebar();

        expect(
            screen.queryByRole('link', { name: /Finanças/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: /Usuários/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: /Pacientes/ }),
        ).toBeInTheDocument();
    });
});
