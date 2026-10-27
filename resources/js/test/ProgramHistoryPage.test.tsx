import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Program } from '@/domain/clinic';
import ProgramHistoryPage from '@/pages/clinic/program/ProgramHistoryPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('sonner', () => ({
    toast: {
        success: (...args: unknown[]) => toastSuccess(...args),
        error: (...args: unknown[]) => toastError(...args),
    },
}));

vi.mock('@/application/clinic/download-program-pdf', () => ({
    downloadProgramPdf: (...args: unknown[]) => fetchPdfBlob(...args),
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
const getById = vi.fn();
const fetchPdfBlob = vi.fn();

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
            getById: (...args: unknown[]) => getById(...args),
            fetchPdfBlob: (...args: unknown[]) => fetchPdfBlob(...args),
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

function DetailProbe() {
    const state = useLocation().state as { from?: string } | null;
    return <div>detalhe do programa, origem: {state?.from ?? '—'}</div>;
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
                        element={<DetailProbe />}
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
        getById.mockResolvedValue(program());
        fetchPdfBlob.mockResolvedValue(
            new Blob(['pdf'], { type: 'application/pdf' }),
        );
        vi.stubGlobal(
            'open',
            vi.fn(() => ({ closed: false })),
        );
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
        expect(listPrograms).toHaveBeenCalledWith(
            expect.objectContaining({ patientId: '10' }),
        );
    });

    it('patientId não numérico não vai para a API e dá lista vazia', async () => {
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage('/clinica/programas/historico?patientId=abc');
        expect(
            await screen.findByText('Nenhum programa encontrado'),
        ).toBeInTheDocument();
        expect(listPrograms).not.toHaveBeenCalledWith(
            expect.objectContaining({ patientId: expect.anything() }),
        );
    });

    it('busca todas as páginas da API: o 201º programa aparece na busca', async () => {
        const user = userEvent.setup();
        const firstPage = Array.from({ length: 200 }, (_, i) =>
            program({
                id: String(i + 1),
                title: `Programa recente ${i + 1}`,
                patientName: `Paciente ${i + 1}`,
                createdAt: '2026-10-18T00:00:00Z',
            }),
        );
        const oldest = program({
            id: '201',
            title: 'Protocolo antigo de ombro',
            patientName: 'Carla Dias',
            createdAt: '2025-01-01T00:00:00Z',
        });
        listPrograms.mockImplementation(({ page }: { page: number }) =>
            Promise.resolve({
                items: page === 1 ? firstPage : [oldest],
                total: 201,
                lastPage: 2,
                perPage: 200,
                currentPage: page,
            }),
        );
        renderPage();

        expect(
            await screen.findByText('201 programas no histórico'),
        ).toBeInTheDocument();
        expect(listPrograms).toHaveBeenCalledWith(
            expect.objectContaining({ page: 2, perPage: 200 }),
        );
        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar programas' }),
            'ombro',
        );
        expect(
            await screen.findByText('Protocolo antigo de ombro'),
        ).toBeInTheDocument();
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

        await user.click(
            screen.getByRole('button', { name: 'Limpar filtros' }),
        );
        expect(
            screen.getByRole('link', { name: 'Ana Souza' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Bruno Lima' }),
        ).toBeInTheDocument();
    });

    it('o chip da busca restaura os cartões ao ser removido', async () => {
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
        await screen.findByRole('link', { name: 'Ana Souza' });
        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar programas' }),
            'joelho',
        );
        expect(
            screen.queryByRole('link', { name: 'Ana Souza' }),
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', {
                name: 'Remover filtro Busca: joelho',
            }),
        );
        expect(
            screen.getByRole('link', { name: 'Ana Souza' }),
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

    it('mostra o esqueleto enquanto a API não responde', () => {
        listPrograms.mockReturnValue(new Promise(() => {}));
        renderPage();
        expect(
            screen.getByLabelText('Carregando programas'),
        ).toBeInTheDocument();
    });

    it('mostra vazio filtrado com Limpar quando a busca não acha', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });
        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar programas' }),
            'xyz-nao-existe',
        );
        expect(
            await screen.findByText('Nenhum programa encontrado'),
        ).toBeInTheDocument();
        await user.click(
            screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!,
        );
        expect(
            await screen.findByRole('link', { name: 'Ana Souza' }),
        ).toBeInTheDocument();
    });

    it('troca a paginação de 16 para 32 e mostra o cartão da página seguinte', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(
            listResult(
                Array.from({ length: 17 }, (_, i) =>
                    program({
                        id: String(i + 1),
                        patientId: String(i + 1),
                        patientName: `Paciente ${i + 1}`,
                        title: `Programa ${i + 1}`,
                    }),
                ),
            ),
        );
        renderPage();
        expect(
            await screen.findByRole('link', { name: 'Paciente 1' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('link', { name: 'Paciente 17' }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('16 por página')).toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Itens por página' }),
        );
        await user.click(
            screen.getByRole('menuitemradio', { name: '32 por página' }),
        );
        expect(
            await screen.findByRole('link', { name: 'Paciente 17' }),
        ).toBeInTheDocument();
        expect(screen.getByText('32 por página')).toBeInTheDocument();
    });

    it('copia o link, abre o PDF e copia o texto do prontuário pelo rodapé', async () => {
        const user = userEvent.setup();
        const withShare = program({
            shareUrl: 'https://exemplo.test/p/1',
            groups: [
                {
                    id: 'g1',
                    name: 'Principal',
                    exercises: [
                        {
                            id: 'e1',
                            exerciseId: '42',
                            title: 'Bird Dog',
                            thumbnailUrl: '',
                            videoUrl: '',
                            days: [1],
                            period: null,
                            seriesMin: 3,
                            seriesMax: 3,
                            repetitionsMin: 10,
                            repetitionsMax: 10,
                            loadMin: null,
                            loadMax: null,
                            restTime: null,
                            notes: null,
                            isConfigured: true,
                        },
                    ],
                },
            ],
        });
        listPrograms.mockResolvedValue(listResult([withShare]));
        getById.mockResolvedValue(withShare);
        renderPage();
        await screen.findByRole('link', { name: 'Ana Souza' });

        await user.click(
            screen.getByRole('button', { name: 'Copiar link do programa' }),
        );
        await waitFor(() => expect(getById).toHaveBeenCalledWith('1'));
        await waitFor(() =>
            expect(toastSuccess).toHaveBeenCalledWith(
                'Link do programa copiado.',
            ),
        );

        await user.click(screen.getByRole('button', { name: 'Baixar PDF' }));
        await waitFor(() => expect(fetchPdfBlob).toHaveBeenCalledWith('1'));

        await user.click(
            screen.getByRole('button', { name: 'Texto para prontuário' }),
        );
        await waitFor(() =>
            expect(toastSuccess).toHaveBeenCalledWith(
                'Texto copiado para a área de transferência.',
            ),
        );
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

    it('secretária vê Excluir desabilitado e não dispara o DELETE', async () => {
        const user = userEvent.setup();
        authRole = 'secretary';
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
        const item = screen.getByRole('menuitem', { name: 'Excluir rascunho' });
        expect(item).toHaveAttribute('aria-disabled', 'true');
        await user.click(item);
        expect(
            screen.queryByRole('heading', { name: 'Excluir rascunho' }),
        ).not.toBeInTheDocument();
        expect(destroyProgram).not.toHaveBeenCalled();
    });

    it('abre o programa levando a origem (Histórico com a busca)', async () => {
        const user = userEvent.setup();
        listPrograms.mockResolvedValue(listResult([program()]));
        renderPage('/clinica/programas/historico?patientId=10');

        await user.click(
            await screen.findByRole('link', { name: 'Ana Souza' }),
        );

        expect(
            screen.getByText(
                'detalhe do programa, origem: /clinica/programas/historico?patientId=10',
            ),
        ).toBeInTheDocument();
    });
});
