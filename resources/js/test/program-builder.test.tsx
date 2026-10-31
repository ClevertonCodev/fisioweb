import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import {
    createMemoryRouter,
    RouterProvider,
    useLocation,
} from 'react-router-dom';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import type { ProgramWriteDto } from '@/application/clinic/ports';
import { programDraftFromExercise } from '@/application/clinic/program-from-exercise';
import * as usePatientsHook from '@/application/clinic/use-patients';
import * as useProgramsHook from '@/application/clinic/use-programs';
import type { Exercise, Program } from '@/domain/clinic';
import ProgramEditPage from '@/pages/clinic/program/ProgramEditPage';
import ProgramNewPage from '@/pages/clinic/program/ProgramNewPage';

// ---------------------------------------------------------------- dublês

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Fisio', role: 'admin' } }),
}));

const draftGet = vi.fn();
const draftSave = vi.fn();
const draftDiscard = vi.fn();
vi.mock('@/infrastructure/repositories/api-clinic-program-draft', () => ({
    programDraftRepository: {
        get: (...a: unknown[]) => draftGet(...a),
        save: (...a: unknown[]) => draftSave(...a),
        discard: (...a: unknown[]) => draftDiscard(...a),
    },
}));

function exercise(overrides: Partial<Exercise>): Exercise {
    return {
        id: '100',
        title: 'Ponte Glútea',
        description: '',
        thumbnailUrl: '',
        videoUrl: '',
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
        reviewStatus: 'approved',
        isOwnSubmission: false,
        sets: 3,
        repetitions: 12,
        restTime: 45,
        createdAt: '',
        ...overrides,
    };
}

const LIBRARY = [
    exercise({}),
    exercise({ id: '200', title: 'Bird Dog', sets: null, repetitions: null }),
];

const listPaginated = vi.fn();
vi.mock('@/infrastructure/repositories', async (importOriginal) => {
    const actual = await importOriginal<{
        apiClinicExercisesRepository: object;
    }>();
    return {
        ...actual,
        apiClinicExercisesRepository: {
            ...actual.apiClinicExercisesRepository,
            listPaginated: (...a: unknown[]) => listPaginated(...a),
        },
    };
});

const PATIENTS = [
    { id: '15', name: 'Ana Souza' },
    { id: '16', name: 'Bruno Lima' },
];

function savedProgram(overrides: Partial<Program> = {}): Program {
    return {
        id: '7',
        title: 'Joelho fase 2',
        patientId: '15',
        patientName: 'Ana Souza',
        patientPhotoUrl: null,
        patientPhone: '11999990000',
        patientEmail: 'ana@exemplo.test',
        shareUrl: 'http://localhost/p/token-real',
        professionalId: null,
        professionalName: null,
        professionalPhotoUrl: null,
        exerciseCount: 2,
        startDate: '2020-01-10',
        endDate: null,
        message: 'Bom treino',
        groups: [
            {
                id: '31',
                name: 'Principal',
                exercises: [
                    {
                        id: '301',
                        exerciseId: '100',
                        title: 'Ponte Glútea',
                        thumbnailUrl: '',
                        videoUrl: '',
                        days: [],
                        period: 'manha',
                        seriesMin: 3,
                        seriesMax: 3,
                        repetitionsMin: 10,
                        repetitionsMax: 10,
                        loadMin: null,
                        loadMax: null,
                        restTime: 60,
                        notes: null,
                        isConfigured: true,
                    },
                ],
            },
        ],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '',
        ...overrides,
    };
}

const create = vi.fn();
const update = vi.fn();

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
        })),
    });
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    listPaginated.mockImplementation(
        async (params: { search?: string } = {}) => {
            const items = LIBRARY.filter(
                (e) =>
                    !params.search ||
                    e.title.toLowerCase().includes(params.search.toLowerCase()),
            );
            return {
                items,
                total: items.length,
                lastPage: 1,
                perPage: 20,
                currentPage: 1,
            };
        },
    );
    draftGet.mockResolvedValue(null);
    draftSave.mockResolvedValue(undefined);
    draftDiscard.mockResolvedValue(undefined);
    create.mockResolvedValue(savedProgram({ id: '50' }));
    update.mockResolvedValue(savedProgram());
    vi.spyOn(useProgramsHook, 'useCreateClinicProgram').mockReturnValue({
        mutateAsync: create,
        isPending: false,
    } as unknown as ReturnType<typeof useProgramsHook.useCreateClinicProgram>);
    vi.spyOn(useProgramsHook, 'useUpdateClinicProgram').mockReturnValue({
        mutateAsync: update,
        isPending: false,
    } as unknown as ReturnType<typeof useProgramsHook.useUpdateClinicProgram>);
    vi.spyOn(usePatientsHook, 'usePatients').mockReturnValue({
        data: { data: PATIENTS },
    } as unknown as ReturnType<typeof usePatientsHook.usePatients>);
    vi.spyOn(usePatientsHook, 'usePatient').mockReturnValue({
        data: undefined,
    } as unknown as ReturnType<typeof usePatientsHook.usePatient>);
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function Destination() {
    const location = useLocation();
    return <div>destino {location.pathname}</div>;
}

function renderAt(
    url: string,
    {
        state,
        program,
    }: { state?: Record<string, unknown>; program?: Program } = {},
) {
    if (program) {
        vi.spyOn(useProgramsHook, 'useClinicProgram').mockReturnValue({
            data: program,
        } as unknown as ReturnType<typeof useProgramsHook.useClinicProgram>);
    }
    const router = createMemoryRouter(
        [
            { path: '/clinica/programas/novo', element: <ProgramNewPage /> },
            {
                path: '/clinica/programas/:id/editar',
                element: <ProgramEditPage />,
            },
            { path: '*', element: <Destination /> },
        ],
        {
            initialEntries: [
                {
                    pathname: url.split('?')[0],
                    search: url.includes('?') ? `?${url.split('?')[1]}` : '',
                    state,
                },
            ],
        },
    );
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    );
    return router;
}

const user = () => userEvent.setup();

async function pick(title: string) {
    await user().click(
        await screen.findByRole('button', {
            name: `Adicionar ${title} ao programa`,
        }),
    );
}

const advance = () =>
    user().click(screen.getByRole('button', { name: 'Avançar' }));

const currentStep = () =>
    within(screen.getByRole('navigation', { name: 'Etapas' }))
        .getAllByRole('listitem')
        .find((li) => li.getAttribute('aria-current') === 'step');

const lastDto = (fn: typeof create): ProgramWriteDto =>
    fn.mock.calls.at(-1)![0] as ProgramWriteDto;

// ---------------------------------------------------------------- novo

describe('assistente: novo programa', () => {
    it('rolar até o fim da biblioteca busca a página 2 na API', async () => {
        const observers: IntersectionObserverCallback[] = [];
        vi.stubGlobal(
            'IntersectionObserver',
            class {
                constructor(cb: IntersectionObserverCallback) {
                    observers.push(cb);
                }
                observe() {}
                disconnect() {}
                unobserve() {}
            },
        );
        listPaginated.mockImplementation(async (params: { page: number }) => ({
            items:
                params.page === 1
                    ? [LIBRARY[0]!]
                    : [exercise({ id: '300', title: 'Prancha', sets: 3 })],
            total: 2,
            lastPage: 2,
            perPage: 20,
            currentPage: params.page,
        }));
        renderAt('/clinica/programas/novo');
        await screen.findByRole('button', {
            name: 'Adicionar Ponte Glútea ao programa',
        });

        act(() => {
            for (const cb of observers)
                cb(
                    [{ isIntersecting: true } as IntersectionObserverEntry],
                    {} as IntersectionObserver,
                );
        });

        expect(
            await screen.findByRole('button', {
                name: 'Adicionar Prancha ao programa',
            }),
        ).toBeInTheDocument();
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ page: 2 }),
        );
    });

    it('escolher o paciente no seletor salva para ele', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().type(screen.getByLabelText('Nome do programa'), 'X');
        await user().click(screen.getByRole('button', { name: /^Paciente/ }));
        await user().click(screen.getByRole('option', { name: 'Bruno Lima' }));
        await user().click(
            screen.getByRole('button', { name: 'Salvar e enviar para Bruno' }),
        );

        await screen.findByRole('dialog');
        expect(lastDto(create).patientId).toBe(16);
    });

    it('o atalho de dose grava o máximo igual ao mínimo', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Bird Dog');
        await advance();
        await user().click(
            screen.getByRole('button', { name: /Definir dose|Editar dose/ }),
        );
        await user().click(screen.getByRole('button', { name: '3 × 12' }));
        await user().click(screen.getByRole('button', { name: 'Aplicar' }));
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().type(screen.getByLabelText('Nome do programa'), 'X');
        await user().click(
            screen.getByRole('button', { name: 'Salvar em Meus modelos' }),
        );

        await waitFor(() => expect(create).toHaveBeenCalled());
        expect(lastDto(create).exercises[0]).toMatchObject({
            setsMin: 3,
            setsMax: 3,
            repetitionsMin: 12,
            repetitionsMax: 12,
        });
    });

    it('abre vazio na etapa 1, sem seletor de variantes', async () => {
        renderAt('/clinica/programas/novo');

        expect(
            screen.getByRole('heading', { name: 'Novo programa' }),
        ).toBeInTheDocument();
        expect(currentStep()).toHaveTextContent('Exercícios');
        expect(screen.queryByText(/Três etapas/)).not.toBeInTheDocument();
        expect(
            await screen.findByRole('button', {
                name: 'Adicionar Ponte Glútea ao programa',
            }),
        ).toBeInTheDocument();
    });

    it('a biblioteca pagina pela API e a busca vai para o servidor', async () => {
        renderAt('/clinica/programas/novo');
        await screen.findByRole('button', {
            name: 'Adicionar Ponte Glútea ao programa',
        });
        expect(listPaginated).toHaveBeenCalledWith(
            expect.objectContaining({ page: 1, perPage: 20 }),
        );

        await user().type(
            screen.getByRole('searchbox', { name: /Pesquisar/ }),
            'bird',
        );

        await waitFor(() =>
            expect(listPaginated).toHaveBeenCalledWith(
                expect.objectContaining({ search: 'bird', page: 1 }),
            ),
        );
    });

    it('o exercício marcado entra com a dose do catálogo e a barra bate com os cards', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');
        await pick('Bird Dog');
        await advance();

        expect(screen.getAllByText('1/2 com dose')[0]).toBeInTheDocument();
        const ponte = screen.getByText('Ponte Glútea').closest('li')!;
        expect(within(ponte).getByText(/séries/)).toBeInTheDocument();
        const bird = screen.getByText('Bird Dog').closest('li')!;
        expect(within(bird).getByText(/Sem dose/)).toBeInTheDocument();
    });

    it('com paciente: salva sem status e abre o diálogo com o link real', async () => {
        renderAt('/clinica/programas/novo?patientId=15');
        await pick('Ponte Glútea');
        await advance();
        await advance();
        await user().type(
            screen.getByLabelText('Nome do programa'),
            'Quadril fase 1',
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar e enviar para Ana' }),
        );

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText('http://localhost/p/token-real'),
        ).toBeInTheDocument();
        const dto = lastDto(create);
        expect(dto).not.toHaveProperty('status');
        expect(dto).toMatchObject({
            title: 'Quadril fase 1',
            patientId: 15,
            groups: [{ name: 'Exercícios', sortOrder: 0 }],
            exercises: [{ exerciseId: 100, groupIndex: 0, setsMin: 3 }],
        });
        expect(dto.exercises[0]).not.toHaveProperty('id', expect.anything());
        expect(update).not.toHaveBeenCalled();
    });

    it('sem paciente, vai para Meus modelos', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');
        await advance();
        await advance();
        await user().type(screen.getByLabelText('Nome do programa'), 'Base');
        await user().click(
            screen.getByRole('button', { name: 'Salvar em Meus modelos' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/meus-modelos'),
        ).toBeInTheDocument();
        expect(lastDto(create).patientId).toBeNull();
    });

    it('erro da API aparece no diálogo e o assistente continua montado', async () => {
        create.mockRejectedValueOnce({
            response: {
                status: 422,
                data: {
                    message: 'Erro',
                    errors: {
                        'exercises.0.exercise_id': [
                            'Exercício não encontrado na biblioteca da clínica.',
                        ],
                    },
                },
            },
        });
        renderAt('/clinica/programas/novo?patientId=15');
        await pick('Ponte Glútea');
        await advance();
        await advance();
        await user().type(screen.getByLabelText('Nome do programa'), 'X');
        await user().click(
            screen.getByRole('button', { name: 'Salvar e enviar para Ana' }),
        );

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText(/Exercício não encontrado na biblioteca/),
        ).toBeInTheDocument();
        await user().click(
            within(dialog).getByRole('button', { name: 'Voltar e corrigir' }),
        );
        expect(screen.getByLabelText('Nome do programa')).toHaveValue('X');
    });

    it('a partir de um exercício abre em "Montar e dosar" com o nome dele', async () => {
        renderAt('/clinica/programas/novo', {
            state: { program: programDraftFromExercise(LIBRARY[0]!) },
        });

        expect(
            screen.getByText('A partir de “Ponte Glútea”'),
        ).toBeInTheDocument();
        expect(currentStep()).toHaveTextContent('Montar e dosar');
        expect(screen.getAllByText('1/1 com dose')[0]).toBeInTheDocument();
        expect(screen.getByLabelText('Nome do programa')).toHaveValue(
            'Ponte Glútea',
        );
    });

    it('"Usar modelo" abre na etapa 2 com os grupos e a dose do modelo', async () => {
        renderAt('/clinica/programas/novo', {
            state: {
                program: savedProgram({
                    id: '9',
                    title: 'Modelo lombar',
                    patientId: null,
                }),
            },
        });

        expect(
            screen.getByText('A partir de “Modelo lombar”'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('region', { name: 'Principal' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome do programa')).toHaveValue(
            'Modelo lombar (Cópia)',
        );
    });
});

// ---------------------------------------------------------------- rascunho, etapas, datas, voltar

describe('assistente: rascunho, etapas e voltar', () => {
    const draft = {
        step: 2,
        selectedIds: [],
        groups: [
            {
                id: 'g1',
                name: 'Do rascunho',
                exercises: [
                    {
                        ...savedProgram().groups[0]!.exercises[0]!,
                        id: 'local-1',
                    },
                ],
            },
        ],
        savedAt: Date.now(),
    };

    it('pelo prontuário também oferece o rascunho', async () => {
        draftGet.mockResolvedValue(draft);
        renderAt('/clinica/programas/novo?patientId=15');

        expect(
            await screen.findByRole('button', { name: 'Restaurar' }),
        ).toBeInTheDocument();
    });

    it('Descartar apaga o rascunho e tira a faixa', async () => {
        draftGet.mockResolvedValue(draft);
        renderAt('/clinica/programas/novo');

        await user().click(
            await screen.findByRole('button', { name: 'Descartar' }),
        );

        expect(draftDiscard).toHaveBeenCalled();
        expect(
            screen.queryByRole('button', { name: 'Restaurar' }),
        ).not.toBeInTheDocument();
    });

    it('no novo vazio, oferece o rascunho e Restaurar repõe os grupos', async () => {
        draftGet.mockResolvedValue(draft);
        renderAt('/clinica/programas/novo');

        await user().click(
            await screen.findByRole('button', { name: 'Restaurar' }),
        );

        expect(
            screen.getByRole('region', { name: 'Do rascunho' }),
        ).toBeInTheDocument();
    });

    it('vindo de um exercício, não oferece nem salva rascunho', async () => {
        draftGet.mockResolvedValue(draft);
        renderAt('/clinica/programas/novo', {
            state: { program: programDraftFromExercise(LIBRARY[0]!) },
        });

        await waitFor(() => expect(draftSave).not.toHaveBeenCalled());
        expect(draftGet).not.toHaveBeenCalled();
        expect(
            screen.queryByRole('button', { name: 'Restaurar' }),
        ).not.toBeInTheDocument();
    });

    it('o rascunho vai para o servidor com os exercícios marcados', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');

        await waitFor(() => expect(draftSave).toHaveBeenCalled(), {
            timeout: 5000,
        });
        expect(draftSave.mock.calls.at(-1)![0]).toMatchObject({
            step: 1,
            selectedIds: ['100'],
        });
    });

    it('salvar apaga o rascunho', async () => {
        renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');
        await advance();
        await advance();
        await user().type(screen.getByLabelText('Nome do programa'), 'X');
        await user().click(
            screen.getByRole('button', { name: 'Salvar em Meus modelos' }),
        );

        await waitFor(() => expect(draftDiscard).toHaveBeenCalled());
    });

    it('pelo prontuário, a etapa 3 já vem com o paciente e Voltar volta ao prontuário', async () => {
        const router = renderAt('/clinica/programas/novo?patientId=16');
        await pick('Ponte Glútea');

        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        expect(
            screen.getByRole('button', { name: 'Salvar e enviar para Bruno' }),
        ).toBeInTheDocument();

        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await user().click(screen.getByRole('button', { name: 'Voltar' }));
        expect(router.state.location.pathname).toBe('/clinica/pacientes/16');
    });

    it('vindo de outra tela, Voltar na etapa 1 volta para ela', async () => {
        const router = renderAt('/clinica/programas/novo', {
            state: {
                program: programDraftFromExercise(LIBRARY[0]!),
                from: '/clinica/programas/exercicios?busca=ponte',
            },
        });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await user().click(screen.getByRole('button', { name: 'Voltar' }));

        expect(router.state.location.pathname).toBe(
            '/clinica/programas/exercicios',
        );
        expect(router.state.location.search).toBe('?busca=ponte');
    });

    it('as etapas só ficam clicáveis com exercício no programa', async () => {
        renderAt('/clinica/programas/novo');
        await screen.findByRole('button', {
            name: 'Adicionar Ponte Glútea ao programa',
        });

        expect(
            screen.queryByRole('button', { name: '3. Paciente e envio' }),
        ).not.toBeInTheDocument();
        await pick('Ponte Glútea');
        expect(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        ).toBeInTheDocument();
    });

    it('entrando direto, Voltar na etapa 1 vai para o Histórico, sem confirmação', async () => {
        const router = renderAt('/clinica/programas/novo');
        await pick('Ponte Glútea');
        await user().click(screen.getByRole('button', { name: 'Voltar' }));

        expect(router.state.location.pathname).toBe(
            '/clinica/programas/historico',
        );
        expect(
            screen.queryByText('Descartar alterações?'),
        ).not.toBeInTheDocument();
    });
});

// ---------------------------------------------------------------- edição

describe('assistente: editar programa', () => {
    it('abre na etapa 2 com os dados do programa', async () => {
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });

        expect(
            screen.getByRole('heading', { name: 'Editar programa' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Editando “Joelho fase 2”'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('region', { name: 'Principal' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Nome do programa')).toHaveValue(
            'Joelho fase 2',
        );
    });

    it('salva com os ids do que já existia, sem status, e abre o diálogo com paciente', async () => {
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await pick('Bird Dog');
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        await screen.findByRole('dialog');
        expect(update).toHaveBeenCalledTimes(1);
        const { id, dto } = update.mock.calls[0]![0] as {
            id: string;
            dto: ProgramWriteDto;
        };
        expect(id).toBe('7');
        expect(dto).not.toHaveProperty('status');
        expect(dto.groups).toEqual([
            { id: 31, name: 'Principal', sortOrder: 0 },
        ]);
        expect(dto.exercises.map((e) => [e.id, e.exerciseId])).toEqual([
            [301, 100],
            [undefined, 200],
        ]);
        // O início que já passou continua valendo na edição.
        expect(dto.startDate).toBe('2020-01-10');
        expect(create).not.toHaveBeenCalled();
    });

    it('sem paciente, salva e volta ao painel do programa', async () => {
        const program = savedProgram({ patientId: null, patientName: null });
        update.mockResolvedValueOnce(program);
        renderAt('/clinica/programas/7/editar', { program });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/7'),
        ).toBeInTheDocument();
        const { dto } = update.mock.calls[0]![0] as { dto: ProgramWriteDto };
        expect(dto.patientId).toBeNull();
    });

    it('salvar depois de mudar sai sem pedir confirmação', async () => {
        const program = savedProgram({ patientId: null, patientName: null });
        update.mockResolvedValueOnce(program);
        renderAt('/clinica/programas/7/editar', { program });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().type(
            screen.getByLabelText('Nome do programa'),
            ' revisado',
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/7'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Descartar alterações?'),
        ).not.toBeInTheDocument();
    });

    it('sem alteração, Voltar sai direto para o painel', async () => {
        const router = renderAt('/clinica/programas/7/editar', {
            program: savedProgram(),
        });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await user().click(screen.getByRole('button', { name: 'Voltar' }));
        expect(router.state.location.pathname).toBe('/clinica/programas/7');
    });

    it('trocar o paciente mostra no diálogo o link novo que voltou do servidor', async () => {
        update.mockResolvedValueOnce(
            savedProgram({
                patientId: '16',
                patientName: 'Bruno Lima',
                shareUrl: 'http://localhost/p/token-novo',
            }),
        );
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText('http://localhost/p/token-novo'),
        ).toBeInTheDocument();
        expect(
            within(dialog).queryByText('http://localhost/p/token-real'),
        ).not.toBeInTheDocument();
    });

    it('depois de salvar, sair da página não avisa de alteração não salva', async () => {
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await pick('Bird Dog');
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );
        await screen.findByRole('dialog');

        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
    });

    it('descanso antigo que não é número não vira "NaN" ao salvar', async () => {
        const program = savedProgram();
        // Dado legado: rest_time guardado como texto.
        (
            program.groups[0]!.exercises[0] as unknown as { restTime: unknown }
        ).restTime = '60s';
        renderAt('/clinica/programas/7/editar', { program });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        await screen.findByRole('dialog');
        const { dto } = update.mock.calls[0]![0] as { dto: ProgramWriteDto };
        expect(dto.exercises[0]!.restTime).toBe(60);
    });

    it('trocar o paciente no seletor salva para o novo paciente', async () => {
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(screen.getByRole('button', { name: /^Paciente/ }));
        await user().click(screen.getByRole('option', { name: 'Bruno Lima' }));
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        await screen.findByRole('dialog');
        const { dto } = update.mock.calls[0]![0] as { dto: ProgramWriteDto };
        expect(dto.patientId).toBe(16);
    });

    it('tirar o paciente no seletor salva sem paciente e volta ao painel', async () => {
        update.mockResolvedValueOnce(
            savedProgram({ patientId: null, patientName: null }),
        );
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '3. Paciente e envio' }),
        );
        await user().click(screen.getByRole('button', { name: /^Paciente/ }));
        await user().click(
            screen.getByRole('option', { name: /Nenhum paciente/ }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar alterações' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/7'),
        ).toBeInTheDocument();
        const { dto } = update.mock.calls[0]![0] as { dto: ProgramWriteDto };
        expect(dto.patientId).toBeNull();
    });

    it('editar com alteração e fechar a aba avisa', async () => {
        renderAt('/clinica/programas/7/editar', { program: savedProgram() });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await pick('Bird Dog');

        const event = new Event('beforeunload', { cancelable: true });
        window.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
    });

    it('com alteração, Voltar abre "Descartar alterações?" e só sai ao confirmar', async () => {
        const router = renderAt('/clinica/programas/7/editar', {
            program: savedProgram(),
        });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await pick('Bird Dog');
        await user().click(screen.getByRole('button', { name: 'Voltar' }));

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText('Descartar alterações?'),
        ).toBeInTheDocument();
        expect(router.state.location.pathname).toBe(
            '/clinica/programas/7/editar',
        );

        await user().click(
            within(dialog).getByRole('button', { name: 'Descartar' }),
        );
        await waitFor(() =>
            expect(router.state.location.pathname).toBe('/clinica/programas/7'),
        );
    });
});

// ---------------------------------------------------------------- modelo

describe('assistente: modelo', () => {
    it('"Usar em novo modelo": etapa 3 só com nome e mensagem, salva sem paciente e volta a Meus modelos', async () => {
        renderAt('/clinica/programas/novo', {
            state: {
                program: programDraftFromExercise(LIBRARY[0]!),
                asModel: true,
            },
        });

        expect(
            screen.getByRole('heading', { name: 'Novo modelo' }),
        ).toBeInTheDocument();
        await user().click(
            screen.getByRole('button', { name: '3. Nome e mensagem' }),
        );
        expect(screen.queryByText('Paciente')).not.toBeInTheDocument();
        expect(screen.queryByText('Período de acesso')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Mensagem padrão')).toBeInTheDocument();
        await user().click(
            screen.getByRole('button', { name: 'Salvar modelo' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/meus-modelos'),
        ).toBeInTheDocument();
        expect(lastDto(create)).toMatchObject({
            title: 'Ponte Glútea',
            patientId: null,
            startDate: null,
            endDate: null,
        });
    });

    it('sair da edição de modelo com alteração pede confirmação', async () => {
        const model = savedProgram({
            id: '9',
            title: 'Meu modelo',
            patientId: null,
            patientName: null,
            status: 'draft',
        });
        const router = renderAt('/clinica/programas/9/editar?modelo=1', {
            program: model,
        });
        await user().click(
            screen.getByRole('button', { name: '1. Exercícios' }),
        );
        await pick('Bird Dog');
        await user().click(screen.getByRole('button', { name: 'Voltar' }));

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).getByText('Descartar alterações?'),
        ).toBeInTheDocument();
        expect(router.state.location.pathname).toBe(
            '/clinica/programas/9/editar',
        );
        await user().click(
            within(dialog).getByRole('button', { name: 'Descartar' }),
        );
        await waitFor(() =>
            expect(router.state.location.pathname).toBe(
                '/clinica/programas/meus-modelos',
            ),
        );
    });

    it('?modelo=1 num programa com paciente abre como programa (não tira o paciente)', async () => {
        renderAt('/clinica/programas/7/editar?modelo=1', {
            program: savedProgram(),
        });

        expect(
            screen.getByRole('heading', { name: 'Editar programa' }),
        ).toBeInTheDocument();
    });

    it('"Editar modelo" pela URL salva o mesmo modelo com os ids e volta a Meus modelos', async () => {
        const model = savedProgram({
            id: '9',
            title: 'Meu modelo',
            patientId: null,
            patientName: null,
            status: 'draft',
        });
        update.mockResolvedValueOnce(model);
        renderAt('/clinica/programas/9/editar?modelo=1', { program: model });

        expect(
            screen.getByRole('heading', { name: 'Editar modelo' }),
        ).toBeInTheDocument();
        await user().click(
            screen.getByRole('button', { name: '3. Nome e mensagem' }),
        );
        await user().click(
            screen.getByRole('button', { name: 'Salvar modelo' }),
        );

        expect(
            await screen.findByText('destino /clinica/programas/meus-modelos'),
        ).toBeInTheDocument();
        const { id, dto } = update.mock.calls[0]![0] as {
            id: string;
            dto: ProgramWriteDto;
        };
        expect(id).toBe('9');
        expect(dto).toMatchObject({ patientId: null, groups: [{ id: 31 }] });
    });
});
