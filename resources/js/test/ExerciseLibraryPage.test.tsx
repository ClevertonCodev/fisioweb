import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Exercise } from '@/domain/clinic';
import ExerciseLibraryPage from '@/pages/clinic/program/exercise-library/ExerciseLibraryPage';
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

const listPaginated = vi.fn();
const toggleFavorite = vi.fn();
let ioCallback: IntersectionObserverCallback | null = null;

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicExercisesRepository: {
            listPaginated: (...args: unknown[]) => listPaginated(...args),
            toggleFavorite: (...args: unknown[]) => toggleFavorite(...args),
        },
    };
});

function exercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: '1',
        title: 'Bird Dog',
        description: 'Apoie joelhos e mãos. Estenda o braço e a perna opostos.',
        thumbnailUrl: 'https://exemplo.test/t.jpg',
        videoUrl: 'https://exemplo.test/v.mp4',
        specialty: 'Ortopedia',
        bodyArea: 'Coluna',
        bodyRegion: 'Lombar',
        objective: 'Estabilizar a coluna',
        difficulty: 'facil',
        muscleGroup: 'Core',
        equipment: '',
        movementType: 'Ativo',
        movementPattern: '',
        movementForm: 'Livre',
        duration: 30,
        isFavorite: false,
        reviewStatus: 'approved',
        isOwnSubmission: false,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

function pageResult(items: Exercise[], currentPage = 1, lastPage = 1) {
    return {
        items,
        total: items.length,
        lastPage,
        perPage: 20,
        currentPage,
    };
}

function NovoSpy() {
    const location = useLocation();
    const program = location.state?.program;
    return (
        <div>
            novo programa
            <span>
                {location.state?.asModel ? 'modo modelo' : 'modo programa'}
            </span>
            <span>{program?.groups?.[0]?.exercises?.[0]?.title}</span>
        </div>
    );
}

function renderPage(url = '/clinica/programas/exercicios') {
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
                        path="/clinica/programas/exercicios"
                        element={<ExerciseLibraryPage />}
                    />
                    <Route
                        path="/clinica/exercicios"
                        element={<ExerciseLibraryPage hideTabs />}
                    />
                    <Route
                        path="/clinica/programas/novo"
                        element={<NovoSpy />}
                    />
                    <Route
                        path="/clinica/exercicios/enviar"
                        element={<div>enviar exercicio</div>}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('ExerciseLibraryPage', () => {
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
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: IntersectionObserverCallback) {
                    ioCallback = cb;
                }
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
    });

    beforeEach(() => {
        vi.clearAllMocks();
        authRole = 'admin';
        ioCallback = null;
        listPaginated.mockResolvedValue(pageResult([exercise()]));
        toggleFavorite.mockResolvedValue({ isFavorite: true });
    });

    it('mostra a grade D com as abas de Programas', async () => {
        renderPage();
        expect(
            await screen.findByRole('heading', {
                name: 'Programas e exercícios',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Exercícios' }),
        ).toBeInTheDocument();
        expect(await screen.findByText('Bird Dog')).toBeInTheDocument();
        expect(screen.getByText('Enviar exercício')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Criar programa' }),
        ).toBeInTheDocument();
    });

    it('na URL do menu não mostra as abas de Programas', async () => {
        renderPage('/clinica/exercicios');
        expect(await screen.findByText('Bird Dog')).toBeInTheDocument();
        expect(
            screen.queryByRole('tab', { name: 'Histórico' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Criar programa' }),
        ).not.toBeInTheDocument();
    });

    it('pede a próxima página no scroll infinito', async () => {
        listPaginated
            .mockResolvedValueOnce(pageResult([exercise()], 1, 2))
            .mockResolvedValueOnce(
                pageResult([exercise({ id: '2', title: 'Agachamento' })], 2, 2),
            );
        renderPage();
        await screen.findByText('Bird Dog');
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, perPage: 20 }),
        );
        ioCallback?.(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ page: 2 }),
        );
        expect(await screen.findByText('Agachamento')).toBeInTheDocument();
    });

    it('envia a busca nos params da API e recorta favoritos no cliente', async () => {
        const user = userEvent.setup();
        listPaginated.mockResolvedValue(
            pageResult([
                exercise({ id: '1', isFavorite: true }),
                exercise({
                    id: '2',
                    title: 'Agachamento',
                    isFavorite: false,
                }),
            ]),
        );
        renderPage();
        await screen.findByText('Bird Dog');

        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar exercícios' }),
            'dog',
        );
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ search: 'dog' }),
        );

        await user.click(screen.getByRole('button', { name: 'Favoritos' }));
        await user.click(
            screen.getByRole('menuitemradio', { name: 'Só favoritos' }),
        );
        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
        expect(screen.queryByText('Agachamento')).not.toBeInTheDocument();
    });

    it('com Só favoritos zerando a página 1, a rolagem busca a página 2', async () => {
        const user = userEvent.setup();
        listPaginated
            .mockResolvedValueOnce(pageResult([exercise()], 1, 2))
            .mockResolvedValueOnce(
                pageResult(
                    [
                        exercise({
                            id: '2',
                            title: 'Agachamento',
                            isFavorite: true,
                        }),
                    ],
                    2,
                    2,
                ),
            );
        renderPage();
        await screen.findByText('Bird Dog');

        await user.click(screen.getByRole('button', { name: 'Favoritos' }));
        await user.click(
            screen.getByRole('menuitemradio', { name: 'Só favoritos' }),
        );
        expect(screen.queryByText('Bird Dog')).not.toBeInTheDocument();
        expect(
            screen.queryByText('Nenhum exercício encontrado'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText('Procurando nos próximos exercícios…'),
        ).toBeInTheDocument();

        ioCallback?.(
            [{ isIntersecting: true } as IntersectionObserverEntry],
            {} as IntersectionObserver,
        );
        expect(await screen.findByText('Agachamento')).toBeInTheDocument();
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ page: 2 }),
        );
    });

    it('sem próxima página, o recorte vazio mostra o estado vazio', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Bird Dog');
        await user.click(screen.getByRole('button', { name: 'Favoritos' }));
        await user.click(
            screen.getByRole('menuitemradio', { name: 'Só favoritos' }),
        );
        expect(
            screen.getByText('Nenhum exercício encontrado'),
        ).toBeInTheDocument();
    });

    it('clicar na estrela chama o toggle', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Bird Dog');
        await user.click(
            screen.getByRole('button', { name: 'Adicionar aos favoritos' }),
        );
        expect(toggleFavorite).toHaveBeenCalledWith('1');
    });

    it('clicar no cartão abre a ficha clínica', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Bird Dog');
        await user.click(screen.getByText('Bird Dog'));
        expect(
            await screen.findByRole('button', {
                name: 'Usar em novo programa',
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Usar em novo modelo' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Como fazer')).toBeInTheDocument();
    });

    it('fisioterapeuta não vê Enviar exercício', async () => {
        authRole = 'physiotherapist';
        renderPage();
        await screen.findByText('Bird Dog');
        expect(screen.queryByText('Enviar exercício')).not.toBeInTheDocument();
    });

    it('usar em novo programa abre o assistente com o exercício', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Bird Dog');
        await user.click(screen.getByText('Bird Dog'));
        await user.click(
            await screen.findByRole('button', {
                name: 'Usar em novo programa',
            }),
        );
        expect(screen.getByText('novo programa')).toBeInTheDocument();
        expect(screen.getByText('modo programa')).toBeInTheDocument();
        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
    });

    it('usar em novo modelo abre o assistente sem paciente', async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText('Bird Dog');
        await user.click(screen.getByText('Bird Dog'));
        await user.click(
            await screen.findByRole('button', {
                name: 'Usar em novo modelo',
            }),
        );
        expect(screen.getByText('modo modelo')).toBeInTheDocument();
        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
    });

    it('busca sem resultado oferece Limpar filtros e restaura a grade', async () => {
        const user = userEvent.setup();
        listPaginated.mockImplementation(
            (params?: { search?: string; page?: number }) => {
                if (params?.search) {
                    return Promise.resolve(pageResult([]));
                }
                return Promise.resolve(
                    pageResult([
                        exercise(),
                        exercise({ id: '2', title: 'Agachamento' }),
                    ]),
                );
            },
        );
        renderPage();
        expect(await screen.findByText('Bird Dog')).toBeInTheDocument();

        await user.type(
            screen.getByRole('searchbox', { name: 'Pesquisar exercícios' }),
            'zzzz',
        );
        expect(
            await screen.findByText('Nenhum exercício encontrado'),
        ).toBeInTheDocument();
        await user.click(
            screen.getAllByRole('button', { name: 'Limpar filtros' })[0]!,
        );
        expect(await screen.findByText('Bird Dog')).toBeInTheDocument();
        expect(screen.getByText('Agachamento')).toBeInTheDocument();
    });
});
