import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { ClinicRole } from '@/domain/auth/session';
import type { EvolutionTemplate } from '@/domain/clinic';
import EvolutionTemplateListPage from '@/pages/clinic/evolution-template/EvolutionTemplateListPage';
import { routerFutureFlags } from '@/test/browser-router';

const listTemplates = vi.fn<() => Promise<EvolutionTemplate[]>>();
const setTemplateActive =
    vi.fn<(id: string, isActive: boolean) => Promise<EvolutionTemplate>>();
const destroyTemplate = vi.fn<(id: string) => Promise<void>>();

vi.mock('@/infrastructure/repositories/api-clinic-evolutions', () => ({
    apiClinicEvolutionsRepository: {
        listTemplates: () => listTemplates(),
        setTemplateActive: (id: string, isActive: boolean) =>
            setTemplateActive(id, isActive),
        destroyTemplate: (id: string) => destroyTemplate(id),
    },
}));

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

const systemTemplate: EvolutionTemplate = {
    id: 1,
    clinicId: null,
    name: 'Template Geral de Fisioterapia',
    description: 'Procedimentos mais comuns na prática clínica.',
    isSystem: true,
    isActive: true,
    sections: [
        {
            id: 10,
            title: 'Anamnese / Avaliação',
            sortOrder: 0,
            items: [
                {
                    id: 100,
                    label: 'Escala de dor (EVA)',
                    printText: 'Avaliação de dor por EVA',
                    hasFreeText: true,
                    freeTextPlaceholder: 'nota de 0 a 10',
                    sortOrder: 0,
                },
            ],
        },
    ],
};

const clinicTemplateActive: EvolutionTemplate = {
    id: 2,
    clinicId: 10,
    name: 'Pós-operatório de LCA',
    description: 'Protocolo de joelho.',
    isSystem: false,
    isActive: true,
    sections: [
        {
            id: 20,
            title: 'Condutas',
            sortOrder: 0,
            items: [
                {
                    id: 200,
                    label: 'Crioterapia',
                    printText: 'Realizada crioterapia por 20 minutos.',
                    hasFreeText: false,
                    freeTextPlaceholder: null,
                    sortOrder: 0,
                },
                {
                    id: 201,
                    label: 'Bicicleta',
                    printText: 'Bicicleta ergométrica sem carga',
                    hasFreeText: true,
                    freeTextPlaceholder: 'minutos',
                    sortOrder: 1,
                },
            ],
        },
    ],
};

const clinicTemplateInactive: EvolutionTemplate = {
    id: 3,
    clinicId: 10,
    name: 'Atendimento domiciliar antigo',
    description: null,
    isSystem: false,
    isActive: false,
    sections: [
        {
            id: 30,
            title: 'Marcha',
            sortOrder: 0,
            items: [
                {
                    id: 300,
                    label: 'Marcha assistida',
                    printText: 'Treino de marcha assistida.',
                    hasFreeText: false,
                    freeTextPlaceholder: null,
                    sortOrder: 0,
                },
            ],
        },
    ],
};

function LocationProbe() {
    const location = useLocation();
    return (
        <p data-testid="probe">
            {location.pathname}
            {location.search}
        </p>
    );
}

function renderList(initialEntry = '/clinica/templates/evolucoes') {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={[initialEntry]}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/templates/evolucoes"
                        element={<EvolutionTemplateListPage />}
                    />
                    <Route
                        path="/clinica/templates/evolucoes/novo"
                        element={<LocationProbe />}
                    />
                    <Route
                        path="/clinica/templates/evolucoes/:id/editar"
                        element={<LocationProbe />}
                    />
                    <Route
                        path="/clinica/pacientes/:id"
                        element={<LocationProbe />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
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
    listTemplates.mockResolvedValue([
        systemTemplate,
        clinicTemplateActive,
        clinicTemplateInactive,
    ]);
    setTemplateActive.mockImplementation(async (id, isActive) => ({
        ...clinicTemplateActive,
        id: Number(id),
        isActive,
    }));
    destroyTemplate.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('EvolutionTemplateListPage (DS v2)', () => {
    it('renderiza cartões com prévia, abas, busca por item e selo Inativo sem modelos Exemplo', async () => {
        const user = userEvent.setup();
        renderList();

        expect(
            await screen.findByRole('heading', {
                name: 'Pós-operatório de LCA',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: 'Template Geral de Fisioterapia',
            }),
        ).toBeInTheDocument();
        expect(screen.getByText('Do sistema')).toBeInTheDocument();
        expect(screen.getByText('Inativo')).toBeInTheDocument();
        expect(screen.queryByText('Exemplo')).not.toBeInTheDocument();

        // Filtra pela aba "Do sistema"
        await user.click(
            screen.getByRole('tab', { name: /Do sistema \(1\)/i }),
        );
        expect(
            screen.queryByRole('heading', { name: 'Pós-operatório de LCA' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: 'Template Geral de Fisioterapia',
            }),
        ).toBeInTheDocument();

        // Volta para "Todos" e busca por nome de item ("Bicicleta")
        await user.click(screen.getByRole('tab', { name: /Todos \(3\)/i }));
        await user.type(
            screen.getByRole('searchbox', {
                name: 'Procurar modelo ou item',
            }),
            'Bicicleta',
        );
        expect(
            screen.getByRole('heading', { name: 'Pós-operatório de LCA' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', {
                name: 'Template Geral de Fisioterapia',
            }),
        ).not.toBeInTheDocument();
    });

    it('abre a gaveta Experimentar e monta o texto no formato do prontuário', async () => {
        const user = userEvent.setup();
        renderList();

        const lcaHeading = await screen.findByRole('heading', {
            name: 'Pós-operatório de LCA',
        });
        const lcaCard = lcaHeading.closest('article')!;
        await user.click(
            within(lcaCard).getByRole('button', { name: 'Experimentar' }),
        );

        const drawer = await screen.findByRole('dialog', {
            name: 'Pós-operatório de LCA',
        });
        await user.click(
            within(drawer).getByRole('button', { name: 'Bicicleta' }),
        );
        await user.type(
            within(drawer).getByRole('textbox', { name: 'Bicicleta' }),
            '15 min',
        );

        expect(drawer).toHaveTextContent('Condutas:');
        expect(drawer).toHaveTextContent(
            'Bicicleta ergométrica sem carga — 15 min',
        );
    });

    it('cartão do sistema tem Duplicar (abre editar) e não tem interruptor Ativo nem Excluir', async () => {
        const user = userEvent.setup();
        renderList();

        const sysHeading = await screen.findByRole('heading', {
            name: 'Template Geral de Fisioterapia',
        });
        const sysCard = sysHeading.closest('article')!;

        expect(
            within(sysCard).queryByRole('button', { name: 'Editar' }),
        ).not.toBeInTheDocument();
        expect(
            within(sysCard).queryByRole('button', { name: 'Excluir' }),
        ).not.toBeInTheDocument();
        expect(
            within(sysCard).queryByRole('switch', { name: 'Ativo' }),
        ).not.toBeInTheDocument();

        await user.click(
            within(sysCard).getByRole('button', { name: 'Duplicar' }),
        );
        expect(screen.getByTestId('probe')).toHaveTextContent(
            '/clinica/templates/evolucoes/1/editar',
        );
    });

    it('interruptor Ativo chama PATCH .../active sem mandar as seções', async () => {
        const user = userEvent.setup();
        renderList();

        const lcaHeading = await screen.findByRole('heading', {
            name: 'Pós-operatório de LCA',
        });
        const lcaCard = lcaHeading.closest('article')!;

        await user.click(
            within(lcaCard).getByRole('switch', { name: 'Ativo' }),
        );

        await waitFor(() => {
            expect(setTemplateActive).toHaveBeenCalledWith('2', false);
        });
    });

    it('admin exclui modelo pelo modal de confirmação', async () => {
        const user = userEvent.setup();
        renderList();

        const lcaHeading = await screen.findByRole('heading', {
            name: 'Pós-operatório de LCA',
        });
        const lcaCard = lcaHeading.closest('article')!;

        await user.click(
            within(lcaCard).getByRole('button', { name: 'Excluir' }),
        );

        const modal = await screen.findByRole('dialog', {
            name: 'Excluir modelo',
        });
        expect(modal).toHaveTextContent(
            'As evoluções já escritas com ele continuam no prontuário.',
        );
        await user.click(
            within(modal).getByRole('button', { name: 'Excluir' }),
        );

        await waitFor(() => {
            expect(destroyTemplate).toHaveBeenCalledWith('2');
        });
    });

    it('fisioterapeuta vê Excluir com aria-disabled e não abre o modal (ADR 017)', async () => {
        authState.user = {
            ...authState.user,
            role: 'physiotherapist',
        };
        const user = userEvent.setup();
        renderList();

        const lcaHeading = await screen.findByRole('heading', {
            name: 'Pós-operatório de LCA',
        });
        const lcaCard = lcaHeading.closest('article')!;

        const deleteBtn = within(lcaCard).getByRole('button', {
            name: 'Excluir',
        });
        expect(deleteBtn).toHaveAttribute('aria-disabled', 'true');
        await user.click(deleteBtn);
        expect(
            screen.queryByRole('dialog', { name: 'Excluir modelo' }),
        ).not.toBeInTheDocument();
    });

    it('secretária vê Novo modelo, Duplicar, Editar, Ativo e Excluir desabilitados (ADR 017)', async () => {
        authState.user = {
            ...authState.user,
            role: 'secretary',
        };
        const user = userEvent.setup();
        renderList();

        const lcaHeading = await screen.findByRole('heading', {
            name: 'Pós-operatório de LCA',
        });
        const lcaCard = lcaHeading.closest('article')!;
        const sysCard = screen
            .getByRole('heading', { name: 'Template Geral de Fisioterapia' })
            .closest('article')!;

        expect(
            screen.getByRole('button', { name: 'Novo modelo' }),
        ).toHaveAttribute('aria-disabled', 'true');
        expect(
            within(sysCard).getByRole('button', { name: 'Duplicar' }),
        ).toHaveAttribute('aria-disabled', 'true');
        expect(
            within(lcaCard).getByRole('button', { name: 'Editar' }),
        ).toHaveAttribute('aria-disabled', 'true');
        expect(
            within(lcaCard).getByRole('button', { name: 'Excluir' }),
        ).toHaveAttribute('aria-disabled', 'true');

        await user.click(
            within(lcaCard).getByRole('switch', { name: 'Ativo' }),
        );
        expect(setTemplateActive).not.toHaveBeenCalled();
    });

    it('repassa returnTo para Novo modelo e Editar e permite voltar ao prontuário', async () => {
        const user = userEvent.setup();
        renderList(
            '/clinica/templates/evolucoes?returnTo=%2Fclinica%2Fpacientes%2F108',
        );

        await screen.findByRole('heading', { name: 'Pós-operatório de LCA' });
        await user.click(screen.getByRole('button', { name: 'Novo modelo' }));
        expect(screen.getByTestId('probe')).toHaveTextContent(
            '/clinica/templates/evolucoes/novo?returnTo=%2Fclinica%2Fpacientes%2F108',
        );
    });
});
