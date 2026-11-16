import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { Exercise } from '@/domain/clinic';
import ExerciseLibraryPage from '@/pages/clinic/program/exercise-library/ExerciseLibraryPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

let authRole = 'admin';

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Ana', type: 'clinic', role: authRole },
        token: 'fake',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const listPaginated = vi.fn();
const requestPresignedThumbnailReplace = vi.fn();
const changeThumbnail = vi.fn();
const syncReferenceImages = vi.fn();

vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@/infrastructure/repositories')>();
    return {
        ...actual,
        apiClinicExercisesRepository: {
            listPaginated: (...args: unknown[]) => listPaginated(...args),
            toggleFavorite: vi.fn(),
        },
        apiClinicVideosRepository: {
            requestPresignedThumbnailReplace: (...args: unknown[]) =>
                requestPresignedThumbnailReplace(...args),
            changeThumbnail: (...args: unknown[]) => changeThumbnail(...args),
            syncReferenceImages: (...args: unknown[]) =>
                syncReferenceImages(...args),
        },
    };
});

vi.mock('@/pages/clinic/exercise-submit/ExerciseImageCropModal', () => ({
    ExerciseImageCropModal: ({
        open,
        imageFile,
        onConfirm,
    }: {
        open: boolean;
        imageFile: File | null;
        onConfirm: (file: File) => void;
    }) =>
        open && imageFile ? (
            <button type="button" onClick={() => onConfirm(imageFile)}>
                Aplicar recorte
            </button>
        ) : null,
}));

class FakeXhr {
    status = 200;
    upload = { addEventListener: vi.fn() };
    private listeners: Record<string, () => void> = {};
    addEventListener(name: string, cb: () => void) {
        this.listeners[name] = cb;
    }
    open() {}
    setRequestHeader() {}
    abort() {}
    send() {
        setTimeout(() => this.listeners.load?.(), 0);
    }
}

function exercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: '10',
        title: 'Ponte da clínica',
        description: 'Deite. Eleve o quadril.',
        thumbnailUrl: 'https://cdn.test/capa-antiga.jpg',
        videoUrl: 'https://cdn.test/v.mp4',
        specialty: 'Ortopedia',
        bodyArea: '',
        bodyRegion: 'Quadril',
        objective: '',
        difficulty: 'facil',
        muscleGroup: '',
        equipment: '',
        movementType: '',
        movementPattern: '',
        movementForm: '',
        duration: 0,
        isFavorite: false,
        reviewStatus: 'pending',
        isOwnSubmission: true,
        videoId: 3,
        referenceImages: [
            {
                path: 'thumbnails/videos/f1.jpg',
                url: 'https://cdn.test/f1.jpg',
            },
            {
                path: 'thumbnails/videos/f2.jpg',
                url: 'https://cdn.test/f2.jpg',
            },
        ],
        mediaProposalPending: false,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

function page(items: Exercise[]) {
    return {
        items,
        total: items.length,
        lastPage: 1,
        perPage: 20,
        currentPage: 1,
    };
}

function renderPage() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter
                initialEntries={['/clinica/exercicios']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/exercicios"
                        element={<ExerciseLibraryPage hideTabs />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function openExercise(title: string) {
    const user = userEvent.setup();
    await user.click(await screen.findByText(title));
    return { user, dialog: await screen.findByRole('dialog') };
}

describe('Trocar imagens no modal da biblioteca', () => {
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
        authRole = 'admin';
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            },
        );
        vi.stubGlobal('XMLHttpRequest', FakeXhr);
        URL.createObjectURL = vi.fn(() => 'blob:nova');
        URL.revokeObjectURL = vi.fn();
        listPaginated.mockResolvedValue(page([exercise()]));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('o admin vê o botão só no exercício da própria clínica', async () => {
        listPaginated.mockResolvedValue(
            page([
                exercise(),
                exercise({
                    id: '20',
                    title: 'Agachamento do catálogo',
                    isOwnSubmission: false,
                    reviewStatus: 'approved',
                }),
            ]),
        );
        renderPage();

        const own = await openExercise('Ponte da clínica');
        expect(
            within(own.dialog).getByRole('button', { name: 'Trocar imagens' }),
        ).toBeInTheDocument();
        await own.user.keyboard('{Escape}');

        const other = await openExercise('Agachamento do catálogo');
        expect(
            within(other.dialog).queryByRole('button', {
                name: 'Trocar imagens',
            }),
        ).not.toBeInTheDocument();
    });

    it('no exercício pendente, a troca vale na hora e o modal mostra as imagens novas', async () => {
        requestPresignedThumbnailReplace
            .mockResolvedValueOnce({
                upload_url: 'https://r2.test/put/capa',
                path: 'thumbnails/videos/capa-nova.jpg',
            })
            .mockResolvedValueOnce({
                upload_url: 'https://r2.test/put/f1',
                path: 'thumbnails/videos/f1-nova.jpg',
            });
        changeThumbnail.mockResolvedValue({ proposalPending: false });
        syncReferenceImages.mockResolvedValue({ proposalPending: false });
        renderPage();

        const { user, dialog } = await openExercise('Ponte da clínica');
        expect(
            within(dialog).queryByText(/vai para revisão do suporte/),
        ).not.toBeInTheDocument();
        await user.click(
            within(dialog).getByRole('button', { name: 'Trocar imagens' }),
        );
        const form = await screen.findByRole('dialog', {
            name: 'Trocar imagens',
        });
        expect(
            within(form).queryByText(/vai para revisão do suporte/),
        ).not.toBeInTheDocument();

        listPaginated.mockResolvedValue(
            page([
                exercise({
                    thumbnailUrl: 'https://cdn.test/capa-nova.jpg',
                    referenceImages: [
                        {
                            path: 'thumbnails/videos/f1-nova.jpg',
                            url: 'https://cdn.test/f1-nova.jpg',
                        },
                        {
                            path: 'thumbnails/videos/f2.jpg',
                            url: 'https://cdn.test/f2.jpg',
                        },
                    ],
                }),
            ]),
        );
        await user.upload(
            within(form).getByLabelText('Escolher Capa'),
            new File(['c'], 'capa.jpg', { type: 'image/jpeg' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );
        await user.upload(
            within(form).getByLabelText('Escolher Foto 1 · posição inicial'),
            new File(['f'], 'f1.jpg', { type: 'image/jpeg' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );
        await user.click(within(form).getByRole('button', { name: 'Salvar' }));

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Trocar imagens' }),
            ).not.toBeInTheDocument(),
        );
        expect(changeThumbnail).toHaveBeenCalledWith(
            3,
            'thumbnails/videos/capa-nova.jpg',
        );
        expect(syncReferenceImages).toHaveBeenCalledWith(3, [
            'thumbnails/videos/f1-nova.jpg',
            'thumbnails/videos/f2.jpg',
        ]);
        const modal = screen.getByRole('dialog');
        await waitFor(() =>
            expect(
                within(modal).getByRole('img', { name: 'Foto 1 do PDF' }),
            ).toHaveAttribute('src', 'https://cdn.test/f1-nova.jpg'),
        );
        expect(modal.querySelector('video')).toHaveAttribute(
            'poster',
            'https://cdn.test/capa-nova.jpg',
        );
        expect(
            within(modal).queryByText('Imagens em revisão'),
        ).not.toBeInTheDocument();
    });

    it('no exercício aprovado, o aviso aparece antes de salvar e o selo depois', async () => {
        listPaginated.mockResolvedValue(
            page([exercise({ reviewStatus: 'approved' })]),
        );
        requestPresignedThumbnailReplace.mockResolvedValue({
            upload_url: 'https://r2.test/put/capa',
            path: 'thumbnails/videos/capa-nova.jpg',
        });
        changeThumbnail.mockResolvedValue({ proposalPending: true });
        renderPage();

        const { user, dialog } = await openExercise('Ponte da clínica');
        expect(
            within(dialog).queryByText('Imagens em revisão'),
        ).not.toBeInTheDocument();
        await user.click(
            within(dialog).getByRole('button', { name: 'Trocar imagens' }),
        );
        const form = await screen.findByRole('dialog', {
            name: 'Trocar imagens',
        });
        expect(
            within(form).getByText(
                'A troca vai para revisão do suporte; até lá, todos continuam vendo a mídia atual.',
            ),
        ).toBeInTheDocument();

        listPaginated.mockResolvedValue(
            page([
                exercise({
                    reviewStatus: 'approved',
                    mediaProposalPending: true,
                }),
            ]),
        );
        await user.upload(
            within(form).getByLabelText('Escolher Capa'),
            new File(['c'], 'capa.jpg', { type: 'image/jpeg' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );
        await user.click(
            within(form).getByRole('button', { name: 'Enviar para revisão' }),
        );

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', { name: 'Trocar imagens' }),
            ).not.toBeInTheDocument(),
        );
        expect(changeThumbnail).toHaveBeenCalledWith(
            3,
            'thumbnails/videos/capa-nova.jpg',
        );
        expect(syncReferenceImages).not.toHaveBeenCalled();
        const modal = screen.getByRole('dialog');
        expect(
            await within(modal).findByText('Imagens em revisão'),
        ).toBeInTheDocument();
        expect(modal.querySelector('video')).toHaveAttribute(
            'poster',
            'https://cdn.test/capa-antiga.jpg',
        );
    });

    it('mostra o motivo quando o servidor recusa a troca', async () => {
        requestPresignedThumbnailReplace.mockResolvedValue({
            upload_url: 'https://r2.test/put/capa',
            path: 'thumbnails/videos/capa-nova.jpg',
        });
        changeThumbnail.mockRejectedValue({
            isAxiosError: true,
            response: {
                status: 422,
                data: { message: 'Capa não autorizada para este vídeo.' },
            },
        });
        renderPage();

        const { user, dialog } = await openExercise('Ponte da clínica');
        await user.click(
            within(dialog).getByRole('button', { name: 'Trocar imagens' }),
        );
        const form = await screen.findByRole('dialog', {
            name: 'Trocar imagens',
        });
        await user.upload(
            within(form).getByLabelText('Escolher Capa'),
            new File(['c'], 'capa.jpg', { type: 'image/jpeg' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Aplicar recorte' }),
        );
        await user.click(within(form).getByRole('button', { name: 'Salvar' }));

        expect(
            await within(form).findByText(
                'Capa não autorizada para este vídeo.',
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('dialog', { name: 'Trocar imagens' }),
        ).toBeInTheDocument();
    });

    it('sem vídeo ligado, o exercício da própria clínica não mostra o botão', async () => {
        listPaginated.mockResolvedValue(
            page([exercise({ videoId: null, referenceImages: [] })]),
        );
        renderPage();
        const { dialog } = await openExercise('Ponte da clínica');
        expect(within(dialog).getByText('Como fazer')).toBeInTheDocument();
        expect(
            within(dialog).queryByRole('button', { name: 'Trocar imagens' }),
        ).not.toBeInTheDocument();
    });

    it.each(['physiotherapist', 'secretary'])(
        '%s não vê o botão no exercício da própria clínica',
        async (role) => {
            authRole = role;
            renderPage();
            const { dialog } = await openExercise('Ponte da clínica');
            expect(within(dialog).getByText('Como fazer')).toBeInTheDocument();
            expect(
                within(dialog).queryByRole('button', {
                    name: 'Trocar imagens',
                }),
            ).not.toBeInTheDocument();
        },
    );
});
