import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';
import type { Exercise } from '@/domain/clinic';
import ExercisesPage from '@/pages/clinic/ExercisesPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...(actual as object), useNavigate: () => vi.fn() };
});

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Test User', type: 'clinic', role: 'owner' },
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const listPaginated = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, unknown>;
    return {
        ...actual,
        apiClinicExercisesRepository: {
            listPaginated: (...args: unknown[]) => listPaginated(...args),
            toggleFavorite: vi.fn(),
        },
    };
});

function makeExercise(id: string): Exercise {
    return {
        id,
        title: `Exercício ${id}`,
        specialty: 'Ortopedia',
        bodyArea: 'Membro Superior',
        bodyRegion: 'Ombro',
        objective: 'Mobilidade',
        difficulty: 'facil',
        muscleGroup: 'Deltoide',
        equipment: 'Nenhum',
        movementType: 'Ativo',
        movementPattern: 'Empurrar',
        movementForm: 'Livre',
        videoUrl: `https://example.test/${id}.mp4`,
        thumbnailUrl: `https://example.test/${id}.jpg`,
        isFavorite: false,
    } as Exercise;
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
    // ExercisesPage usa IntersectionObserver para o scroll infinito.
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            observe() {}
            unobserve() {}
            disconnect() {}
        },
    );
});

beforeEach(() => {
    listPaginated.mockReset();
    listPaginated.mockResolvedValue({
        items: [makeExercise('1'), makeExercise('2')],
        currentPage: 1,
        lastPage: 1,
    });
});

function renderPage(queryClient: QueryClient) {
    // Usa BrowserRouter direto — TestBrowserRouter cria outro QueryClient
    // e anularia o cache compartilhado deste teste.
    return render(
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <BrowserRouter future={routerFutureFlags}>
                    <ExercisesPage embedded />
                </BrowserRouter>
            </TooltipProvider>
        </QueryClientProvider>,
    );
}

describe('ExercisesPage', () => {
    it('lista os exercicios na primeira visita', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        renderPage(queryClient);

        expect(await screen.findByText('Exercício 1')).toBeInTheDocument();
        expect(screen.getByText('2 exercícios encontrados')).toBeInTheDocument();
    });

    it('mantem os exercicios ao remontar com o cache ja aquecido', async () => {
        const queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false, gcTime: Infinity } },
        });

        // Primeira visita: aquece o cache do React Query.
        const first = renderPage(queryClient);
        expect(await screen.findByText('Exercício 1')).toBeInTheDocument();

        // Sai da pagina.
        first.unmount();

        // Volta com cache aquecido (staleTime: Infinity): a lista precisa
        // aparecer no primeiro paint — sem o bug de exercises ficar [].
        renderPage(queryClient);

        expect(screen.getByText('Exercício 1')).toBeInTheDocument();
        expect(screen.getByText('2 exercícios encontrados')).toBeInTheDocument();
        expect(
            screen.queryByText('Nenhum exercício encontrado'),
        ).not.toBeInTheDocument();
    });
});
