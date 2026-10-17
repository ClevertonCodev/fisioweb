import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { ClinicTopbar } from '@/components/clinic/ClinicTopbar';
import type { ClinicRole } from '@/domain/auth/session';
import { routerFutureFlags } from '@/test/browser-router';

const authState = {
    user: {
        id: 1,
        name: 'Ana Admin',
        email: 'ana@clinic.test',
        role: 'admin' as ClinicRole,
        clinicId: 10,
    },
    logout: vi.fn(),
};

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => authState,
}));

function renderTopbar(path = '/clinica') {
    return render(
        <MemoryRouter initialEntries={[path]} future={routerFutureFlags}>
            <ClinicTopbar />
        </MemoryRouter>,
    );
}

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
    authState.user = {
        id: 1,
        name: 'Ana Admin',
        email: 'ana@clinic.test',
        role: 'admin',
        clinicId: 10,
    };
    authState.logout = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('ClinicTopbar', () => {
    it('mostra Finanças e Usuários para o admin da clínica', () => {
        renderTopbar();

        expect(
            screen.getByRole('link', { name: 'Finanças' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Usuários' }),
        ).toBeInTheDocument();
    });

    it('esconde Finanças e Usuários do hamburger do fisioterapeuta', async () => {
        authState.user = {
            ...authState.user,
            name: 'Pedro Fisio',
            role: 'physiotherapist',
        };
        const user = userEvent.setup();
        renderTopbar();

        await user.click(screen.getByRole('button', { name: 'Abrir menu' }));

        const dialog = screen.getByRole('dialog', { name: 'Menu' });
        expect(
            within(dialog).queryByRole('link', { name: 'Finanças' }),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).queryByRole('link', { name: 'Usuários' }),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).getByRole('link', { name: 'Pacientes' }),
        ).toBeInTheDocument();
    });

    it('esconde Finanças e Usuários do fisioterapeuta', () => {
        authState.user = {
            ...authState.user,
            name: 'Pedro Fisio',
            role: 'physiotherapist',
        };

        renderTopbar();

        expect(
            screen.queryByRole('link', { name: 'Finanças' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Usuários' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Pacientes' }),
        ).toBeInTheDocument();
    });

    it('marca Programas como página atual em rota aninhada do programa', () => {
        renderTopbar('/clinica/programas/42');

        expect(screen.getByRole('link', { name: 'Programas' })).toHaveAttribute(
            'aria-current',
            'page',
        );
        expect(
            screen.getByRole('link', { name: 'Início' }),
        ).not.toHaveAttribute('aria-current');
    });

    it('expõe o atalho de agendar consulta para a agenda', () => {
        renderTopbar();

        expect(
            screen.getByRole('link', { name: 'Agendar consulta' }),
        ).toHaveAttribute('href', '/clinica/agenda');
    });

    it('mostra Dados da clínica no menu da conta do admin', async () => {
        const user = userEvent.setup();
        renderTopbar();

        await user.click(screen.getByRole('button', { name: 'Menu da conta' }));

        expect(
            screen.getByRole('button', { name: /Dados da clínica/ }),
        ).toBeInTheDocument();
    });

    it('esconde Dados da clínica no menu da conta da secretária', async () => {
        authState.user = {
            ...authState.user,
            name: 'Carla Secretaria',
            role: 'secretary',
        };
        const user = userEvent.setup();
        renderTopbar();

        await user.click(screen.getByRole('button', { name: 'Menu da conta' }));

        expect(
            screen.queryByRole('button', { name: /Dados da clínica/ }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Meu perfil/ }),
        ).toBeInTheDocument();
        expect(screen.queryByText('#10')).not.toBeInTheDocument();
    });

    it('esconde o hamburger no desktop e a fileira de ícones no mobile', () => {
        renderTopbar();

        expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveClass(
            'md:hidden',
        );
        expect(
            screen.getByRole('navigation', { name: 'Navegação principal' }),
        ).toHaveClass('hidden', 'md:flex');
    });

    it('abre o menu hamburger com os itens da navegação', async () => {
        const user = userEvent.setup();
        renderTopbar();

        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Abrir menu' }));

        const dialog = screen.getByRole('dialog', { name: 'Menu' });
        expect(
            within(dialog).getByRole('navigation', { name: 'Menu da clínica' }),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('link', { name: 'Pacientes' }),
        ).toBeInTheDocument();
        expect(
            within(dialog).getByRole('link', { name: 'Finanças' }),
        ).toBeInTheDocument();
    });

    it('fecha o menu hamburger ao escolher um item', async () => {
        const user = userEvent.setup();
        renderTopbar();

        await user.click(screen.getByRole('button', { name: 'Abrir menu' }));
        const dialog = screen.getByRole('dialog', { name: 'Menu' });
        expect(
            within(dialog).getByRole('link', { name: 'Pacientes' }),
        ).toHaveAttribute('href', '/clinica/pacientes');
        await user.click(
            within(dialog).getByRole('link', { name: 'Pacientes' }),
        );

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });

    it('aplica as classes de botão branco no tema escuro', () => {
        renderTopbar();

        expect(screen.getByRole('link', { name: 'Agenda' })).toHaveClass(
            'ds-dark:text-ds-white',
        );
        expect(screen.getByRole('link', { name: 'Início' })).toHaveClass(
            'ds-dark:bg-ds-white',
        );
        expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveClass(
            'ds-dark:text-ds-white',
        );
    });
});

describe('ClinicLayout', () => {
    it('monta a topbar Z e não a sidebar hamburger da v1', () => {
        render(
            <MemoryRouter
                initialEntries={['/clinica']}
                future={routerFutureFlags}
            >
                <ClinicLayout>
                    <p>conteúdo da página</p>
                </ClinicLayout>
            </MemoryRouter>,
        );

        expect(
            screen.getByRole('navigation', { name: 'Navegação principal' }),
        ).toBeInTheDocument();
        expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
        expect(screen.getByText('conteúdo da página')).toBeInTheDocument();
        expect(document.querySelector('.bg-background')).toBeTruthy();
        expect(
            document.querySelector('.bg-ds-surface-body'),
        ).not.toBeInTheDocument();
    });
});
