import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Program } from '@/domain/clinic';
import ProgramHistoryPage from '@/pages/clinic/program/ProgramHistoryPage';
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

const listPrograms = vi.fn();
const listProfessionals = vi.fn();
const duplicateProgram = vi.fn();
const toModelProgram = vi.fn();
const destroyProgram = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicProgramsRepository: {
            list: (...args: unknown[]) => listPrograms(...args),
            duplicate: (...args: unknown[]) => duplicateProgram(...args),
            toModel: (...args: unknown[]) => toModelProgram(...args),
            destroy: (...args: unknown[]) => destroyProgram(...args),
            getById: vi.fn(),
            fetchPdfBlob: vi.fn(),
        },
        apiClinicUsersRepository: {
            listProfessionals: (...args: unknown[]) =>
                listProfessionals(...args),
        },
    };
});

function program(overrides: Partial<Program> = {}): Program {
    return {
        id: '1',
        title: 'Reabilitação Lombar — Fase 1',
        patientId: '10',
        patientName: 'Ana Souza',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: 'https://exemplo.test/p/1',
        professionalId: '1',
        professionalName: 'Cleverton',
        professionalPhotoUrl: null,
        exerciseCount: 5,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        message: '',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-10-18T00:00:00Z',
        ...overrides,
    };
}

function listResult(items: Program[]) {
    return {
        items,
        total: items.length,
        lastPage: 1,
        perPage: 200,
        currentPage: 1,
    };
}

function renderPage(url = '/clinica/programas/historico') {
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
                        path="/clinica/programas/historico"
                        element={<ProgramHistoryPage />}
                    />
                    <Route
                        path="/clinica/programas/:id"
                        element={<div>detalhe do programa</div>}
                    />
                    <Route
                        path="/clinica/programas/exercicios"
                        element={<div>aba exercicios</div>}
                    />
                    <Route
                        path="/clinica/programas/modelos"
                        element={<div>aba modelos</div>}
                    />
                    <Route
                        path="/clinica/programas/meus-modelos"
                        element={<div>aba meus modelos</div>}
                    />
                    <Route
                        path="/clinica/programas/novo"
                        element={<div>novo programa</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ProgramHistoryPage', () => {
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
        listPrograms.mockResolvedValue(listResult([]));
        listProfessionals.mockResolvedValue([]);
        duplicateProgram.mockResolvedValue(program());
        toModelProgram.mockResolvedValue(program({ patientId: null }));
        destroyProgram.mockResolvedValue(undefined);
    });

    it('mostra a casca v2 e os cartões, sem a tabela v1', async () => {
        listPrograms.mockResolvedValue(
            listResult([
                program(),
                program({
                    id: '2',
                    title: 'Rascunho modelo',
                    patientId: null,
                    patientName: null,
                    status: 'draft',
                }),
            ]),
        );

        renderPage();

        expect(
            await screen.findByRole('heading', {
                name: 'Programas e exercícios',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Histórico' }),
        ).toBeInTheDocument();
        expect(
            await screen.findByRole('link', { name: 'Ana Souza' }),
        ).toHaveAttribute('href', '/clinica/programas/1');
        expect(screen.getByText('(sem paciente)')).toBeInTheDocument();
        expect(screen.getByText('Não visualizado')).toBeInTheDocument();
        expect(screen.getByText('Rascunho')).toBeInTheDocument();
        expect(screen.getAllByText('5 exercícios').length).toBeGreaterThan(0);
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('restringe os cartões ao patientId da URL', async () => {
        listPrograms.mockResolvedValue(
            listResult([
                program({ id: '1', patientId: '10', patientName: 'Ana Souza' }),
                program({
                    id: '2',
                    patientId: '20',
                    patientName: 'Bruno Lima',
                }),
            ]),
        );

        renderPage('/clinica/programas/historico?patientId=10');

        expect(
            await screen.findByRole('link', { name: 'Ana Souza' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Bruno Lima' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Paciente: Ana Souza')).toBeInTheDocument();
    });

    it('mostra estado vazio quando não há programas', async () => {
        listPrograms.mockResolvedValue(listResult([]));
        renderPage();

        expect(
            await screen.findByText('Nenhum programa criado'),
        ).toBeInTheDocument();
    });

    it('mostra erro quando a API falha', async () => {
        listPrograms.mockRejectedValue(new Error('falhou'));
        renderPage();

        expect(
            await screen.findByText('Erro ao carregar programas'),
        ).toBeInTheDocument();
    });

    it('filtra pela busca e o Limpar restaura os cartões', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(
            listResult([
                program({ id: '1', title: 'Lombar', patientName: 'Ana Souza' }),
                program({
                    id: '2',
                    title: 'Joelho',
                    patientName: 'Bruno Lima',
                }),
            ]),
        );
        renderPage();
        expect(
            await screen.findByRole('link', { name: 'Ana Souza' }),
        ).toBeInTheDocument();

        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar programas' }),
            'joelho',
        );

        expect(
            screen.queryByRole('link', { name: 'Ana Souza' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Bruno Lima' }),
        ).toBeInTheDocument();
    });

    it('navega para Exercícios pela aba', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });

        await user.click(screen.getByRole('tab', { name: 'Exercícios' }));
        expect(screen.getByText('aba exercicios')).toBeInTheDocument();
    });

    it('duplica o programa pelo menu de ações', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(screen.getByRole('menuitem', { name: 'Duplicar' }));
        expect(duplicateProgram).toHaveBeenCalledWith('1');
    });

    it('pede confirmação para excluir rascunho', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(
            listResult([
                program({
                    id: '9',
                    title: 'Rascunho para apagar',
                    status: 'draft',
                    patientId: null,
                    patientName: null,
                }),
            ]),
        );
        renderPage();
        await screen.findByText('Rascunho para apagar');

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir rascunho' }),
        );
        expect(
            screen.getByRole('heading', { name: 'Excluir rascunho' }),
        ).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        expect(destroyProgram).toHaveBeenCalledWith('9');
    });

    it('não mostra Excluir em programa ativo', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        expect(
            screen.queryByRole('menuitem', { name: 'Excluir rascunho' }),
        ).not.toBeInTheDocument();
    });

    it('transforma o programa em modelo pelo menu', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Transformar em modelo' }),
        );
        expect(toModelProgram).toHaveBeenCalledWith('1');
    });

    it('fisioterapeuta vê Excluir desabilitado e não dispara o DELETE', async () => {
        const user = userEvent.setup();
        authRole = 'physiotherapist';
        listPrograms.mockResolvedValue(
            listResult([
                program({
                    id: '9',
                    title: 'Rascunho para apagar',
                    status: 'draft',
                    patientId: null,
                    patientName: null,
                }),
            ]),
        );
        renderPage();
        await screen.findByText('Rascunho para apagar');

        await user.click(screen.getByRole('button', { name: 'Mais ações' }));
        await user.click(
            screen.getByRole('menuitem', { name: 'Excluir rascunho' }),
        );
        expect(
            screen.queryByRole('heading', { name: 'Excluir rascunho' }),
        ).not.toBeInTheDocument();
        expect(destroyProgram).not.toHaveBeenCalled();
    });
});
