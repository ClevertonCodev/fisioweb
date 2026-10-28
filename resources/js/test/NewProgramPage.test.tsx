import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import * as useExercisesHook from '@/application/clinic/use-exercises';
import * as usePatientsHook from '@/application/clinic/use-patients';
import * as useProgramsHook from '@/application/clinic/use-programs';
import ProgramNewPage from '@/pages/clinic/program/ProgramNewPage';
import { TestBrowserRouter } from '@/test/browser-router';

// Configurando mocks globais para funções do window que não existem no jsdom
beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

// Mock do QueryClient e provedores necessários
const mockNavigate = vi.fn();
const copiedProgram = {
    title: 'Modelo Vedius 1',
    message: 'Instruções do modelo',
    groups: [
        {
            id: 'group1',
            name: 'Grupo Principal',
            exercises: [
                {
                    id: 'ex1',
                    exerciseId: '100',
                    title: 'Agachamento',
                    thumbnailUrl: 'thumb.jpg',
                    videoUrl: 'video.mp4',
                    daysOfWeek: [1, 3, 5],
                    period: 'manha',
                    setsMin: 3,
                    setsMax: 3,
                },
            ],
        },
    ],
};
const mockLocation: {
    pathname: string;
    state: {
        program: typeof copiedProgram;
        asModel?: boolean;
        editMode?: boolean;
        programId?: string;
    };
} = {
    pathname: '/clinica/programas/novo',
    state: { program: copiedProgram },
};

const exercises = [
    {
        id: '100',
        title: 'Agachamento',
        thumbnailUrl: 'thumb.jpg',
        videoUrl: 'video.mp4',
    },
    {
        id: '101',
        title: 'Flexão',
        thumbnailUrl: 'thumb2.jpg',
        videoUrl: 'video2.mp4',
    },
];

function stubWizardHooks(mockMutate: ReturnType<typeof vi.fn>) {
    draftGet.mockResolvedValue(null);
    draftSave.mockResolvedValue(undefined);
    draftDiscard.mockResolvedValue(undefined);
    vi.spyOn(useExercisesHook, 'useExercises').mockReturnValue({
        data: exercises,
        isLoading: false,
    } as ReturnType<typeof useExercisesHook.useExercises>);
    vi.spyOn(useExercisesHook, 'useInfiniteExercises').mockReturnValue({
        data: { pages: [{ items: exercises }] },
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
    } as unknown as ReturnType<typeof useExercisesHook.useInfiniteExercises>);
    vi.spyOn(useProgramsHook, 'useCreateClinicProgram').mockReturnValue({
        mutate: mockMutate,
        isPending: false,
    } as unknown as ReturnType<typeof useProgramsHook.useCreateClinicProgram>);
    vi.spyOn(usePatientsHook, 'usePatients').mockReturnValue({
        data: { data: [] },
        isLoading: false,
    } as ReturnType<typeof usePatientsHook.usePatients>);
}

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
    };
});

const draftGet = vi.fn();
const draftSave = vi.fn();
const draftDiscard = vi.fn();
vi.mock('@/infrastructure/repositories/api-clinic-program-draft', () => ({
    programDraftRepository: {
        get: (...args: unknown[]) => draftGet(...args),
        save: (...args: unknown[]) => draftSave(...args),
        discard: (...args: unknown[]) => draftDiscard(...args),
    },
}));

// Mock do auth context
vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Test User', type: 'clinic' },
        token: 'fake-token',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

describe('NewProgramPage com preenchimento via location.state', () => {
    const mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.state = { program: copiedProgram };
        stubWizardHooks(mockMutate);
    });

    const renderComponent = () => {
        return render(
            <TestBrowserRouter>
                <ProgramNewPage />
            </TestBrowserRouter>,
        );
    };

    it('deve inicializar na etapa 2 com os dados preenchidos se receber um programa no state', async () => {
        renderComponent();

        // Verifica se pulou a etapa 1 (Novo programa) e foi para a etapa 2 (Configurar exercícios)
        expect(screen.getByText('Configurar exercícios')).toBeInTheDocument();

        // Verifica se o exercício herdado do state foi renderizado no grupo correto
        expect(screen.getByText('Grupo Principal')).toBeInTheDocument();
        expect(screen.getByText('Agachamento')).toBeInTheDocument();
    });

    it('deve preservar o título copiado e a mensagem ao avançar para a etapa 4 e salvar', async () => {
        const user = userEvent.setup();
        renderComponent();

        // Estamos na etapa 2. Avançamos para a etapa 4 pela barra do wizard.
        await user.click(screen.getByRole('button', { name: /^avançar$/i }));

        // Agora estamos na etapa 4 (Detalhes do programa)
        expect(screen.getByText('Detalhes do programa')).toBeInTheDocument();

        // Verifica se o título e a mensagem foram preenchidos corretamente no form
        const titleInput = screen.getByPlaceholderText(/título do programa/i);
        expect(titleInput).toHaveValue('Modelo Vedius 1 (Cópia)');

        const messageInput = screen.getByPlaceholderText(/mensage/i);
        expect(messageInput).toHaveValue('Instruções do modelo');

        // Clica em Salvar
        const saveButton = screen.getByRole('button', { name: /^salvar$/i });
        await user.click(saveButton);

        // Verifica se a mutation de salvar foi chamada com os dados esperados
        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Modelo Vedius 1 (Cópia)',
                message: 'Instruções do modelo',
                groups: expect.arrayContaining([
                    expect.objectContaining({ name: 'Grupo Principal' }),
                ]),
                exercises: expect.arrayContaining([
                    expect.objectContaining({ exerciseId: 100, setsMin: 3 }),
                ]),
            }),
            expect.any(Object),
        );
    });

    it('o passo de detalhes já vem com o paciente do ?patientId=', async () => {
        window.history.pushState(
            {},
            '',
            '/clinica/programas/novo?patientId=108',
        );
        vi.spyOn(usePatientsHook, 'usePatients').mockReturnValue({
            data: {
                data: [
                    {
                        id: '108',
                        name: 'QA Mobile',
                        initial: 'Q',
                        professional: 'Cleverton',
                        professionalInitial: 'C',
                        status: 'em_tratamento',
                        diagnosis: '',
                        isActive: true,
                    },
                ],
            },
            isLoading: false,
        } as ReturnType<typeof usePatientsHook.usePatients>);

        const user = userEvent.setup();
        renderComponent();
        await user.click(screen.getByRole('button', { name: /^avançar$/i }));

        expect(screen.getByText('Detalhes do programa')).toBeInTheDocument();
        expect(screen.getByRole('combobox')).toHaveTextContent('QA Mobile');
    });

    it('deve exibir botão "Adicionar novo grupo" na etapa 2', () => {
        renderComponent();

        expect(screen.getByText('Adicionar novo grupo')).toBeInTheDocument();
    });

    it('deve voltar para etapa 1 e exibir grupos na sidebar ao clicar "Voltar"', async () => {
        const user = userEvent.setup();
        renderComponent();

        // Header BackButton é a navegação "voltar" do wizard.
        await user.click(screen.getByRole('button', { name: /^voltar$/i }));

        // Agora estamos na etapa 1 (Novo programa)
        expect(screen.getByText('Novo programa')).toBeInTheDocument();

        // A sidebar deve mostrar os grupos criados
        expect(screen.getByText('Grupo Principal')).toBeInTheDocument();

        // Deve exibir o botão "Adicionar exercícios nesse grupo" para o grupo
        expect(
            screen.getByText('Adicionar exercícios nesse grupo'),
        ).toBeInTheDocument();
    });
});

describe('NewProgramPage em modo modelo (asModel)', () => {
    const mockMutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.state = { program: copiedProgram, asModel: true };
        stubWizardHooks(mockMutate);
    });

    afterEach(() => {
        mockLocation.state = { program: copiedProgram };
    });

    it('pula o paciente, grava patientId nulo e cai em Meus modelos', async () => {
        const user = userEvent.setup();
        render(
            <TestBrowserRouter>
                <ProgramNewPage />
            </TestBrowserRouter>,
        );

        expect(screen.getByText('Configurar exercícios')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /^avançar$/i }));

        expect(screen.getByText('Detalhes do modelo')).toBeInTheDocument();
        expect(
            screen.getByText(
                /Este modelo fica sem paciente\. Depois de salvar, ele aparece em Meus modelos\./,
            ),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('combobox', { name: /enviar para/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText(/título do programa/i)).toHaveValue(
            'Modelo Vedius 1',
        );

        await user.click(
            screen.getByRole('button', { name: /^salvar modelo$/i }),
        );

        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Modelo Vedius 1',
                patientId: null,
                status: 'draft',
            }),
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );

        const options = mockMutate.mock.calls[0]?.[1] as {
            onSuccess: (program: { id: string }) => void;
        };
        options.onSuccess({ id: '42' });
        expect(mockNavigate).toHaveBeenCalledWith(
            '/clinica/programas/meus-modelos',
        );
    });
});

describe('NewProgramPage editando um modelo (editMode + asModel)', () => {
    const mockMutate = vi.fn();
    const mockUpdate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.state = {
            program: copiedProgram,
            asModel: true,
            editMode: true,
            programId: '9',
        };
        stubWizardHooks(mockMutate);
        vi.spyOn(useProgramsHook, 'useUpdateClinicProgram').mockReturnValue({
            mutate: mockUpdate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useProgramsHook.useUpdateClinicProgram
        >);
    });

    afterEach(() => {
        mockLocation.state = { program: copiedProgram };
    });

    it('não apaga nem sobrescreve o rascunho do Novo programa', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const meuRascunho = {
            step: 2,
            selectedIds: ['101'],
            groups: [],
            savedAt: 1000,
        };
        localStorage.setItem(
            'clinic_new_program_draft',
            JSON.stringify(meuRascunho),
        );
        draftGet.mockResolvedValue(meuRascunho);
        const user = userEvent.setup({
            advanceTimers: vi.advanceTimersByTime,
        });
        try {
            render(
                <TestBrowserRouter>
                    <ProgramNewPage />
                </TestBrowserRouter>,
            );
            expect(
                screen.queryByText(/Rascunho salvo/),
            ).not.toBeInTheDocument();

            await user.click(
                screen.getByRole('button', { name: /^avançar$/i }),
            );
            await user.click(
                screen.getByRole('button', { name: /^salvar modelo$/i }),
            );
            const options = mockUpdate.mock.calls[0]?.[1] as {
                onSuccess: (program: { id: string }) => void;
            };
            options.onSuccess({ id: '9' });
            vi.advanceTimersByTime(3500);

            expect(draftGet).not.toHaveBeenCalled();
            expect(draftDiscard).not.toHaveBeenCalled();
            expect(draftSave).not.toHaveBeenCalled();
            expect(
                JSON.parse(
                    localStorage.getItem('clinic_new_program_draft') ?? '{}',
                ),
            ).toEqual(meuRascunho);
        } finally {
            vi.useRealTimers();
            localStorage.clear();
        }
    });

    it('Voltar na primeira etapa leva a Meus modelos', async () => {
        const user = userEvent.setup();
        render(
            <TestBrowserRouter>
                <ProgramNewPage />
            </TestBrowserRouter>,
        );
        await user.click(screen.getByRole('button', { name: /^voltar$/i }));
        await user.click(screen.getByRole('button', { name: /^voltar$/i }));
        expect(mockNavigate).toHaveBeenCalledWith(
            '/clinica/programas/meus-modelos',
        );
    });

    it('salva o mesmo modelo sem paciente e volta a Meus modelos', async () => {
        const user = userEvent.setup();
        render(
            <TestBrowserRouter>
                <ProgramNewPage />
            </TestBrowserRouter>,
        );

        await user.click(screen.getByRole('button', { name: /^avançar$/i }));
        expect(screen.getByText('Detalhes do modelo')).toBeInTheDocument();
        expect(
            screen.queryByRole('combobox', { name: /enviar para/i }),
        ).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: /^salvar modelo$/i }),
        );

        expect(mockMutate).not.toHaveBeenCalled();
        expect(mockUpdate).toHaveBeenCalledWith(
            {
                id: '9',
                dto: expect.objectContaining({
                    title: 'Modelo Vedius 1',
                    patientId: null,
                    status: 'draft',
                }),
            },
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );

        const options = mockUpdate.mock.calls[0]?.[1] as {
            onSuccess: (program: { id: string }) => void;
        };
        options.onSuccess({ id: '9' });
        expect(mockNavigate).toHaveBeenCalledWith(
            '/clinica/programas/meus-modelos',
        );
    });
});
