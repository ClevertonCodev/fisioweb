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

import type { EvolutionTemplateWriteDto } from '@/application/clinic/ports';
import type { ClinicRole } from '@/domain/auth/session';
import type { EvolutionTemplate } from '@/domain/clinic';
import EvolutionTemplateEditPage from '@/pages/clinic/evolution-template/EvolutionTemplateEditPage';
import EvolutionTemplateNewPage from '@/pages/clinic/evolution-template/EvolutionTemplateNewPage';
import { routerFutureFlags } from '@/test/browser-router';

const findTemplate = vi.fn<(id: string) => Promise<EvolutionTemplate>>();
const createTemplate =
    vi.fn<(dto: EvolutionTemplateWriteDto) => Promise<EvolutionTemplate>>();
const updateTemplate =
    vi.fn<
        (
            id: string,
            dto: EvolutionTemplateWriteDto,
        ) => Promise<EvolutionTemplate>
    >();

vi.mock('@/infrastructure/repositories/api-clinic-evolutions', () => ({
    apiClinicEvolutionsRepository: {
        findTemplate: (id: string) => findTemplate(id),
        createTemplate: (dto: EvolutionTemplateWriteDto) => createTemplate(dto),
        updateTemplate: (id: string, dto: EvolutionTemplateWriteDto) =>
            updateTemplate(id, dto),
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
    description: 'Procedimentos mais comuns.',
    isSystem: true,
    isActive: true,
    sections: [
        {
            id: 10,
            title: 'Anamnese',
            sortOrder: 0,
            items: [
                {
                    id: 100,
                    label: 'EVA',
                    printText: 'Dor por EVA',
                    hasFreeText: true,
                    freeTextPlaceholder: '0 a 10',
                    sortOrder: 0,
                },
            ],
        },
    ],
};

const clinicTemplate: EvolutionTemplate = {
    id: 2,
    clinicId: 10,
    name: 'Pós-operatório de LCA',
    description: 'Fases 1 a 3.',
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
                    printText: 'Realizada crioterapia.',
                    hasFreeText: false,
                    freeTextPlaceholder: null,
                    sortOrder: 0,
                },
                {
                    id: 201,
                    label: 'Bicicleta',
                    printText: 'Bicicleta sem carga',
                    hasFreeText: true,
                    freeTextPlaceholder: 'minutos',
                    sortOrder: 1,
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

function renderEditor(initialEntry: string) {
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
                        element={<LocationProbe />}
                    />
                    <Route
                        path="/clinica/templates/evolucoes/novo"
                        element={<EvolutionTemplateNewPage />}
                    />
                    <Route
                        path="/clinica/templates/evolucoes/:id/editar"
                        element={<EvolutionTemplateEditPage />}
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
    findTemplate.mockImplementation(async (id) =>
        id === '1' ? systemTemplate : clinicTemplate,
    );
    createTemplate.mockResolvedValue(clinicTemplate);
    updateTemplate.mockResolvedValue(clinicTemplate);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('EvolutionTemplateNewPage e EvolutionTemplateEditPage (DS v2)', () => {
    it('no novo modelo, mostra o primeiro problema e quantos faltam no rodapé e cria via RHF + Zod', async () => {
        const user = userEvent.setup();
        renderEditor('/clinica/templates/evolucoes/novo');

        // Estado inicial vazio: 3 problemas (nome, título da seção 1, item 1 da seção 1)
        expect(
            screen.getByText(/Dê um nome ao modelo\. \(\+2\)/),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        expect(createTemplate).not.toHaveBeenCalled();

        await user.type(
            screen.getByLabelText('Nome do modelo'),
            'Pilates clínico',
        );
        expect(
            screen.getByText(/A seção 1 está sem título\. \(\+1\)/),
        ).toBeInTheDocument();

        await user.type(
            screen.getByRole('textbox', { name: 'Título da seção 1' }),
            'Aparelhos',
        );
        expect(
            screen.getByText('Item 1 da seção 1: falta o nome.'),
        ).toBeInTheDocument();

        await user.type(
            screen.getByRole('textbox', { name: 'Nome do item' }),
            'Reformer',
        );
        expect(
            screen.getByText('Item 1 da seção 1: falta o texto do prontuário.'),
        ).toBeInTheDocument();

        await user.type(
            screen.getByRole('textbox', { name: 'Texto no prontuário' }),
            'Exercícios no Reformer.',
        );
        expect(screen.getByText('1 seções · 1 itens')).toBeInTheDocument();

        // Prévia ao vivo ao lado monta o texto do prontuário
        const preview = screen.getByRole('complementary');
        await user.click(
            within(preview).getByRole('button', { name: 'Reformer' }),
        );
        expect(preview).toHaveTextContent('Aparelhos:');
        expect(preview).toHaveTextContent('Exercícios no Reformer.');

        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        await waitFor(() => {
            expect(createTemplate).toHaveBeenCalledWith({
                name: 'Pilates clínico',
                description: null,
                sections: [
                    {
                        title: 'Aparelhos',
                        sortOrder: 0,
                        items: [
                            {
                                label: 'Reformer',
                                printText: 'Exercícios no Reformer.',
                                hasFreeText: false,
                                freeTextPlaceholder: null,
                                sortOrder: 0,
                            },
                        ],
                    },
                ],
            });
        });
    });

    it('na edição de modelo da clínica, envia o id de cada seção e item existente e sem id nos novos', async () => {
        const user = userEvent.setup();
        renderEditor(
            '/clinica/templates/evolucoes/2/editar?returnTo=%2Fclinica%2Fpacientes%2F108',
        );

        expect(
            await screen.findByDisplayValue('Pós-operatório de LCA'),
        ).toBeInTheDocument();

        // Remove o primeiro item (Crioterapia, id 200), renomeia Bicicleta (id 201) e adiciona um item novo
        const removeItemButtons = screen.getAllByRole('button', {
            name: 'Remover item',
        });
        await user.click(removeItemButtons[0]!);

        const itemLabelInput = screen.getByRole('textbox', {
            name: 'Nome do item',
        });
        await user.clear(itemLabelInput);
        await user.type(itemLabelInput, 'Bicicleta ergométrica');

        await user.click(screen.getByRole('button', { name: 'Item' }));
        const labels = screen.getAllByRole('textbox', { name: 'Nome do item' });
        const prints = screen.getAllByRole('textbox', {
            name: 'Texto no prontuário',
        });
        await user.type(labels[1]!, 'Isometria');
        await user.type(prints[1]!, 'Isometria de quadríceps.');

        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => {
            expect(updateTemplate).toHaveBeenCalledWith('2', {
                name: 'Pós-operatório de LCA',
                description: 'Fases 1 a 3.',
                isActive: true,
                sections: [
                    {
                        id: 20,
                        title: 'Condutas',
                        sortOrder: 0,
                        items: [
                            {
                                id: 201,
                                label: 'Bicicleta ergométrica',
                                printText: 'Bicicleta sem carga',
                                hasFreeText: true,
                                freeTextPlaceholder: 'minutos',
                                sortOrder: 0,
                            },
                            {
                                label: 'Isometria',
                                printText: 'Isometria de quadríceps.',
                                hasFreeText: false,
                                freeTextPlaceholder: null,
                                sortOrder: 1,
                            },
                        ],
                    },
                ],
            });
        });

        expect(screen.getByTestId('probe')).toHaveTextContent(
            '/clinica/pacientes/108',
        );
    });

    it('modelo do sistema mostra aviso e Salvar como cópia cria modelo novo sem mandar os ids originais', async () => {
        const user = userEvent.setup();
        renderEditor('/clinica/templates/evolucoes/1/editar');

        expect(
            await screen.findByText('Modelo do sistema'),
        ).toBeInTheDocument();

        const saveCopyBtn = screen.getByRole('button', {
            name: 'Salvar como cópia',
        });
        await user.click(saveCopyBtn);

        await waitFor(() => {
            expect(createTemplate).toHaveBeenCalledWith({
                name: 'Template Geral de Fisioterapia',
                description: 'Procedimentos mais comuns.',
                sections: [
                    {
                        title: 'Anamnese',
                        sortOrder: 0,
                        items: [
                            {
                                label: 'EVA',
                                printText: 'Dor por EVA',
                                hasFreeText: true,
                                freeTextPlaceholder: '0 a 10',
                                sortOrder: 0,
                            },
                        ],
                    },
                ],
            });
        });
        expect(updateTemplate).not.toHaveBeenCalled();
    });

    it('cancelar volta para o returnTo quando informado', async () => {
        const user = userEvent.setup();
        renderEditor(
            '/clinica/templates/evolucoes/novo?returnTo=%2Fclinica%2Fpacientes%2F108',
        );

        await user.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(screen.getByTestId('probe')).toHaveTextContent(
            '/clinica/pacientes/108',
        );
    });
});
