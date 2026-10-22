import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminProgram } from '@/domain/admin';
import type { Program } from '@/domain/clinic';
import ProgramModelsPage from '@/pages/clinic/program/program-models/ProgramModelsPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let authRole = 'admin';

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Cleverton', type: 'clinic', role: authRole },
        token: 'fake',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const listLibrary = vi.fn();
const getLibraryDetail = vi.fn();
const listMine = vi.fn();
const getMine = vi.fn();
const duplicateProgram = vi.fn();
const destroyProgram = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicProgramsLibraryRepository: {
            list: (...args: unknown[]) => listLibrary(...args),
            getDetail: (...args: unknown[]) => getLibraryDetail(...args),
        },
        apiClinicProgramsRepository: {
            list: (...args: unknown[]) => listMine(...args),
            getById: (...args: unknown[]) => getMine(...args),
            duplicate: (...args: unknown[]) => duplicateProgram(...args),
            destroy: (...args: unknown[]) => destroyProgram(...args),
        },
    };
});

function catalogProgram(overrides: Partial<AdminProgram> = {}): AdminProgram {
    return {
        id: 1,
        title: 'Reabilitação lombar — fase 1',
        description: 'Protocolo para lombalgia',
        physioAreaId: 1,
        physioSubareaId: null,
        durationMinutes: 20,
        isActive: true,
        physioArea: { id: 1, name: 'Ortopedia' },
        createdBy: { id: 1, name: 'Sistema' },
        groups: [
            {
                id: 10,
                adminProgramId: 1,
                name: 'Aquecimento',
                sortOrder: 0,
                exercises: [
                    {
                        id: 100,
                        exerciseId: 5,
                        adminProgramGroupId: 10,
                        daysOfWeek: [1, 3, 5],
                        period: 'morning',
                        setsMin: 3,
                        setsMax: 3,
                        repetitionsMin: 10,
                        repetitionsMax: 10,
                        loadMin: null,
                        loadMax: null,
                        restTime: 30,
                        notes: null,
                        sortOrder: 0,
                        exercise: {
                            id: 5,
                            name: 'Bird Dog',
                            thumbnailUrl: '',
                            videoUrl: '',
                        },
                    },
                ],
            },
        ],
        ...overrides,
    };
}

function myProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '9',
        title: 'Meu modelo de joelho',
        patientId: null,
        patientName: null,
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '1',
        professionalName: 'Cleverton',
        professionalPhotoUrl: null,
        exerciseCount: 1,
        startDate: '',
        endDate: null,
        message: 'Pós-LCA',
        groups: [],
        status: 'draft',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-10-01T00:00:00Z',
        ...overrides,
    };
}

function LocationState() {
    const location = useLocation();
    const program = location.state?.program;
    const first = program?.groups?.[0]?.exercises?.[0];
    const exerciseTitle = first?.title ?? first?.exercise?.name;
    return (
        <div>
            novo programa
            <span>{program?.title}</span>
            <span>{program?.groups?.[0]?.name}</span>
            <span>{exerciseTitle}</span>
        </div>
    );
}

function renderPage(url = '/clinica/programas/modelos') {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[url]} future={routerFutureFlags}>
                <Routes>
                    <Route
                        path="/clinica/programas/modelos"
                        element={<ProgramModelsPage />}
                    />
                    <Route
                        path="/clinica/programas/meus-modelos"
                        element={<ProgramModelsPage />}
                    />
                    <Route
                        path="/clinica/programas/novo"
                        element={<LocationState />}
                    />
                    <Route
                        path="/clinica/programas/:id/editar"
                        element={<div>editar modelo</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ProgramModelsPage', () => {
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
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    beforeEach(() => {
        vi.clearAllMocks();
        authRole = 'admin';
        listLibrary.mockResolvedValue({
            data: [catalogProgram()],
            meta: { currentPage: 1, lastPage: 1, total: 1 },
        });
        getLibraryDetail.mockResolvedValue(catalogProgram());
        listMine.mockResolvedValue({
            items: [myProgram()],
            total: 1,
            lastPage: 1,
            perPage: 200,
            currentPage: 1,
        });
        getMine.mockResolvedValue(myProgram());
        duplicateProgram.mockResolvedValue(myProgram({ id: '10' }));
        destroyProgram.mockResolvedValue(undefined);
    });

    it('lista Nossos modelos do catálogo e não mostra o menu de ações', async () => {
        renderPage();
        expect(
            await screen.findByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(listLibrary).toHaveBeenCalled();
        expect(listMine).not.toHaveBeenCalled();
        expect(
            screen.queryByRole('button', {
                name: /Mais ações/,
            }),
        ).not.toBeInTheDocument();
    });

    it('lista só Meus modelos da clínica sem paciente', async () => {
        renderPage('/clinica/programas/meus-modelos');
        expect(
            await screen.findByText('Meu modelo de joelho'),
        ).toBeInTheDocument();
        expect(listMine).toHaveBeenCalledWith(
            expect.objectContaining({ withoutPatient: true }),
        );
        expect(
            screen.queryByText('Reabilitação lombar — fase 1'),
        ).not.toBeInTheDocument();
        expect(
            screen.getAllByRole('button', {
                name: 'Mais ações de Meu modelo de joelho',
            }).length,
        ).toBeGreaterThan(0);
    });

    it('clicar em Lombar reduz a lista', async () => {
        const user = userEvent.setup();
        listLibrary.mockResolvedValue({
            data: [
                catalogProgram(),
                catalogProgram({
                    id: 2,
                    title: 'Cervical aguda',
                    description: 'Pescoço',
                }),
            ],
            meta: { currentPage: 1, lastPage: 1, total: 2 },
        });
        renderPage();
        expect(
            await screen.findByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cervical aguda')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Lombar: / }));
        expect(
            screen.getByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Cervical aguda')).not.toBeInTheDocument();
    });

    it('usar modelo abre o assistente com o título do protocolo', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Reabilitação lombar — fase 1');
        await waitFor(() =>
            expect(
                screen
                    .getAllByRole('button', { name: 'Usar modelo' })
                    .some((b) => b.getAttribute('aria-busy') !== 'true'),
            ).toBe(true),
        );
        const useButton = screen
            .getAllByRole('button', { name: 'Usar modelo' })
            .find((b) => b.getAttribute('aria-busy') !== 'true');
        await user.click(useButton!);
        expect(
            await screen.findByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.getByText('novo programa')).toBeInTheDocument();
        expect(screen.getByText('Aquecimento')).toBeInTheDocument();
        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
    });

    it('em Meus modelos Editar abre a rota de edição', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/programas/meus-modelos');
        await screen.findByText('Meu modelo de joelho');
        await user.click(
            screen.getAllByRole('button', {
                name: 'Mais ações de Meu modelo de joelho',
            })[0]!,
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Editar modelo' }),
        );
        expect(screen.getByText('editar modelo')).toBeInTheDocument();
    });

    it('em Meus modelos o admin duplica e exclui com confirmação', async () => {
        const user = userEvent.setup();
        renderPage('/clinica/programas/meus-modelos');
        await screen.findByText('Meu modelo de joelho');

        await user.click(
            screen.getAllByRole('button', {
                name: 'Mais ações de Meu modelo de joelho',
            })[0]!,
        );
        await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
        expect(duplicateProgram).toHaveBeenCalledWith('9');

        await user.click(
            screen.getAllByRole('button', {
                name: 'Mais ações de Meu modelo de joelho',
            })[0]!,
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir modelo' }),
        );
        expect(
            screen.getByRole('heading', { name: 'Excluir modelo' }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        expect(destroyProgram).toHaveBeenCalledWith('9');
    });

    it('Limpar filtros da busca restaura os cartões', async () => {
        const user = userEvent.setup();
        listLibrary.mockResolvedValue({
            data: [
                catalogProgram(),
                catalogProgram({
                    id: 2,
                    title: 'Cervical aguda',
                    description: 'Pescoço',
                }),
            ],
            meta: { currentPage: 1, lastPage: 1, total: 2 },
        });
        renderPage();
        expect(
            await screen.findByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cervical aguda')).toBeInTheDocument();

        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar modelos' }),
            'lombar',
        );
        expect(
            screen.getByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.queryByText('Cervical aguda')).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Limpar filtros' }),
        );
        expect(
            screen.getByText('Reabilitação lombar — fase 1'),
        ).toBeInTheDocument();
        expect(screen.getByText('Cervical aguda')).toBeInTheDocument();
    });

    it('fisioterapeuta não dispara o DELETE do modelo', async () => {
        const user = userEvent.setup();
        authRole = 'physiotherapist';
        renderPage('/clinica/programas/meus-modelos');
        await screen.findByText('Meu modelo de joelho');
        await user.click(
            screen.getAllByRole('button', {
                name: 'Mais ações de Meu modelo de joelho',
            })[0]!,
        );
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir modelo' }),
        );
        expect(destroyProgram).not.toHaveBeenCalled();
    });
});
