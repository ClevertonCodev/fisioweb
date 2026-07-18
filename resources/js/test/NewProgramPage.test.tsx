import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

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
const mockLocation = {
    pathname: '/clinica/programas/novo',
    state: {
        program: {
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
        },
    },
};

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...(actual as object),
        useNavigate: () => mockNavigate,
        useLocation: () => mockLocation,
    };
});

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

        vi.spyOn(useExercisesHook, 'useExercises').mockReturnValue({
            data: [
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
            ],
            isLoading: false,
        } as ReturnType<typeof useExercisesHook.useExercises>);

        vi.spyOn(useProgramsHook, 'useCreateClinicProgram').mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as unknown as ReturnType<
            typeof useProgramsHook.useCreateClinicProgram
        >);

        vi.spyOn(usePatientsHook, 'usePatients').mockReturnValue({
            data: { data: [] },
            isLoading: false,
        } as ReturnType<typeof usePatientsHook.usePatients>);
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
