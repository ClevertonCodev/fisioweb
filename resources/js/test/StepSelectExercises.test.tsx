import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { StepSelectExercises } from '@/components/clinic/program/StepSelectExercises';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Exercise, ProgramExercise, ProgramGroup } from '@/domain/clinic';

/* ── Stubs globais ── */

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
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

afterEach(() => {
    vi.clearAllMocks();
});

/* ── Factories ── */

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
    const id = overrides.id ?? `ex-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        title: 'Exercício',
        thumbnailUrl: 'thumb.jpg',
        videoUrl: 'video.mp4',
        specialty: '',
        bodyArea: '',
        bodyRegion: '',
        objective: '',
        difficulty: 'facil',
        muscleGroup: '',
        equipment: '',
        movementType: '',
        movementPattern: '',
        movementForm: '',
        duration: 30,
        isFavorite: false,
        reviewStatus: 'approved',
        isOwnSubmission: false,
        createdAt: '2026-01-01',
        ...overrides,
    };
}

function makeProgramExercise(
    overrides: Partial<ProgramExercise> = {},
): ProgramExercise {
    const id = overrides.id ?? `pe-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        exerciseId: overrides.exerciseId ?? id,
        title: 'Agachamento',
        thumbnailUrl: 'thumb.jpg',
        videoUrl: 'video.mp4',
        days: [],
        period: null,
        seriesMin: null,
        seriesMax: null,
        repetitionsMin: null,
        repetitionsMax: null,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: null,
        isConfigured: false,
        ...overrides,
    };
}

function makeGroup(
    overrides: Partial<ProgramGroup> & { exercises?: ProgramExercise[] } = {},
): ProgramGroup {
    return {
        id: `group-${Math.random().toString(36).slice(2, 8)}`,
        name: 'Novo grupo',
        exercises: [],
        ...overrides,
    };
}

/* ── Helpers ── */

type Props = Parameters<typeof StepSelectExercises>[0];

function renderStep(overrides: Partial<Props> = {}) {
    const props: Props = {
        exercises: overrides.exercises ?? [],
        selectedIds: overrides.selectedIds ?? [],
        groups: overrides.groups ?? [],
        targetGroupId: overrides.targetGroupId ?? null,
        onToggleSelect: overrides.onToggleSelect ?? vi.fn(),
        onRemove: overrides.onRemove ?? vi.fn(),
        onRemoveFromGroup: overrides.onRemoveFromGroup ?? vi.fn(),
        onSetTargetGroup: overrides.onSetTargetGroup ?? vi.fn(),
        onNext: overrides.onNext ?? vi.fn(),
        fetchNextPage: overrides.fetchNextPage ?? vi.fn(),
        hasNextPage: overrides.hasNextPage ?? false,
        isFetchingNextPage: overrides.isFetchingNextPage ?? false,
    };

    const result = render(
        <TooltipProvider>
            <StepSelectExercises {...props} />
        </TooltipProvider>,
    );
    return { ...result, ...props };
}

/* ── Testes — renderização básica ── */

describe('StepSelectExercises — renderização', () => {
    it('exibe campo de pesquisa', () => {
        renderStep({ exercises: [makeExercise()] });
        expect(screen.getByPlaceholderText('Pesquisar')).toBeInTheDocument();
    });

    it('exibe cards dos exercícios disponíveis', () => {
        const exercises = [
            makeExercise({ id: '1', title: 'Agachamento' }),
            makeExercise({ id: '2', title: 'Flexão' }),
        ];
        renderStep({ exercises });

        expect(screen.getByText('Agachamento')).toBeInTheDocument();
        expect(screen.getByText('Flexão')).toBeInTheDocument();
    });

    it('não exibe sidebar quando nenhum exercício está selecionado e não há grupos', () => {
        renderStep({
            exercises: [makeExercise({ id: '1', title: 'Agachamento' })],
        });
        expect(screen.queryByText(/selecionado/i)).not.toBeInTheDocument();
    });
});

/* ── Testes — filtros ── */

describe('StepSelectExercises — pesquisa', () => {
    it('filtra exercícios ao digitar na pesquisa', async () => {
        const user = userEvent.setup();
        const exercises = [
            makeExercise({ id: '1', title: 'Agachamento' }),
            makeExercise({ id: '2', title: 'Flexão' }),
        ];
        renderStep({ exercises });

        await user.type(screen.getByPlaceholderText('Pesquisar'), 'Flex');

        expect(screen.queryByText('Agachamento')).not.toBeInTheDocument();
        expect(screen.getByText('Flexão')).toBeInTheDocument();
    });

    it('filtra por favoritos ao clicar no botão', async () => {
        const user = userEvent.setup();
        const exercises = [
            makeExercise({ id: '1', title: 'Agachamento', isFavorite: true }),
            makeExercise({ id: '2', title: 'Flexão', isFavorite: false }),
        ];
        renderStep({ exercises });

        await user.click(screen.getByRole('button', { name: /favoritos/i }));

        expect(screen.getByText('Agachamento')).toBeInTheDocument();
        expect(screen.queryByText('Flexão')).not.toBeInTheDocument();
    });
});

/* ── Testes — seleção flat (sem grupos) ── */

describe('StepSelectExercises — seleção flat (sem grupos)', () => {
    it('exibe sidebar com contagem de selecionados', () => {
        const exercises = [
            makeExercise({ id: '1', title: 'Agachamento' }),
            makeExercise({ id: '2', title: 'Flexão' }),
        ];
        renderStep({ exercises, selectedIds: ['1', '2'] });

        expect(
            screen.getByText('2 exercícios selecionados'),
        ).toBeInTheDocument();
    });

    it('exibe 1 exercício selecionado (singular)', () => {
        const exercises = [makeExercise({ id: '1', title: 'Agachamento' })];
        renderStep({ exercises, selectedIds: ['1'] });

        expect(screen.getByText('1 exercício selecionado')).toBeInTheDocument();
    });

    it('exibe exercícios selecionados na sidebar flat', () => {
        const exercises = [
            makeExercise({ id: '1', title: 'Agachamento' }),
            makeExercise({ id: '2', title: 'Flexão' }),
        ];
        renderStep({ exercises, selectedIds: ['1'] });

        // O título aparece no grid e na sidebar
        const agachamentoElements = screen.getAllByText('Agachamento');
        expect(agachamentoElements.length).toBeGreaterThanOrEqual(2);
    });

    it('chama onRemove ao clicar no trash da sidebar flat', async () => {
        const user = userEvent.setup();
        const onRemove = vi.fn();
        const exercises = [makeExercise({ id: '1', title: 'Agachamento' })];
        renderStep({ exercises, selectedIds: ['1'], onRemove });

        // Encontrar o botão de remover na sidebar
        const sidebarHeader = screen.getByText('1 exercício selecionado');
        const sidebar = sidebarHeader.closest('[class*="w-80"]');
        const removeBtn = sidebar?.querySelector('[class*="destructive"]');

        expect(removeBtn).toBeDefined();
        await user.click(removeBtn as Element);

        expect(onRemove).toHaveBeenCalledWith('1');
    });

    it('chama onNext ao clicar em "Avançar"', async () => {
        const user = userEvent.setup();
        const onNext = vi.fn();
        const exercises = [makeExercise({ id: '1', title: 'Agachamento' })];
        renderStep({ exercises, selectedIds: ['1'], onNext });

        await user.click(screen.getByRole('button', { name: /avançar/i }));

        expect(onNext).toHaveBeenCalledOnce();
    });
});

/* ── Testes — sidebar com grupos ── */

describe('StepSelectExercises — sidebar com grupos', () => {
    it('exibe nomes dos grupos na sidebar', () => {
        const ex1 = makeProgramExercise({
            id: 'pe1',
            exerciseId: '1',
            title: 'Agachamento',
        });
        const ex2 = makeProgramExercise({
            id: 'pe2',
            exerciseId: '2',
            title: 'Flexão',
        });
        const groups = [
            makeGroup({ id: 'g1', name: 'Aquecimento', exercises: [ex1] }),
            makeGroup({ id: 'g2', name: 'Principal', exercises: [ex2] }),
        ];

        renderStep({
            exercises: [
                makeExercise({ id: '1', title: 'Agachamento' }),
                makeExercise({ id: '2', title: 'Flexão' }),
            ],
            selectedIds: ['1', '2'],
            groups,
        });

        expect(screen.getByText('Aquecimento')).toBeInTheDocument();
        expect(screen.getByText('Principal')).toBeInTheDocument();
    });

    it('exibe contagem total de exercícios na header da sidebar', () => {
        const ex1 = makeProgramExercise({
            id: 'pe1',
            exerciseId: '1',
            title: 'Agachamento',
        });
        const ex2 = makeProgramExercise({
            id: 'pe2',
            exerciseId: '2',
            title: 'Flexão',
        });
        const groups = [
            makeGroup({ id: 'g1', name: 'Grupo A', exercises: [ex1, ex2] }),
        ];

        renderStep({
            exercises: [
                makeExercise({ id: '1', title: 'Agachamento' }),
                makeExercise({ id: '2', title: 'Flexão' }),
            ],
            selectedIds: ['1', '2'],
            groups,
        });

        expect(
            screen.getByText('2 exercícios selecionados'),
        ).toBeInTheDocument();
    });

    it('exibe botão "Adicionar exercícios nesse grupo" para cada grupo', () => {
        const groups = [
            makeGroup({ id: 'g1', name: 'Aquecimento', exercises: [] }),
            makeGroup({ id: 'g2', name: 'Principal', exercises: [] }),
        ];

        renderStep({
            exercises: [makeExercise({ id: '1' })],
            groups,
        });

        const addButtons = screen.getAllByText(
            'Adicionar exercícios nesse grupo',
        );
        expect(addButtons).toHaveLength(2);
    });

    it('chama onSetTargetGroup ao clicar em "Adicionar exercícios nesse grupo"', async () => {
        const user = userEvent.setup();
        const onSetTargetGroup = vi.fn();
        const groups = [
            makeGroup({ id: 'g1', name: 'Aquecimento', exercises: [] }),
            makeGroup({ id: 'g2', name: 'Principal', exercises: [] }),
        ];

        renderStep({
            exercises: [makeExercise({ id: '1' })],
            groups,
            onSetTargetGroup,
        });

        const addButtons = screen.getAllByText(
            'Adicionar exercícios nesse grupo',
        );
        await user.click(addButtons[1]); // Segundo grupo "Principal"

        expect(onSetTargetGroup).toHaveBeenCalledWith('g2');
    });

    it('destaca o grupo alvo quando targetGroupId está definido', () => {
        const groups = [
            makeGroup({ id: 'g1', name: 'Aquecimento', exercises: [] }),
            makeGroup({ id: 'g2', name: 'Principal', exercises: [] }),
        ];

        renderStep({
            exercises: [makeExercise({ id: '1' })],
            groups,
            targetGroupId: 'g2',
        });

        const addButtons = screen.getAllByText(
            'Adicionar exercícios nesse grupo',
        );
        // O botão do grupo alvo deve ter classe border-primary
        const targetBtn = addButtons[1].closest('button');
        const otherBtn = addButtons[0].closest('button');
        expect(targetBtn?.className).toContain('border-primary');
        expect(otherBtn?.className).not.toContain('border-primary');
    });

    it('chama onRemoveFromGroup ao remover exercício na sidebar com grupos', async () => {
        const user = userEvent.setup();
        const onRemoveFromGroup = vi.fn();
        const ex1 = makeProgramExercise({
            id: 'pe1',
            exerciseId: '1',
            title: 'Agachamento',
        });
        const groups = [
            makeGroup({ id: 'g1', name: 'Grupo A', exercises: [ex1] }),
        ];

        renderStep({
            exercises: [makeExercise({ id: '1', title: 'Agachamento' })],
            selectedIds: ['1'],
            groups,
            onRemoveFromGroup,
        });

        // Encontrar o botão trash na sidebar (no exercício dentro do grupo)
        const sidebarHeader = screen.getByText(/exercício.*selecionado/i);
        const sidebar = sidebarHeader.closest('[class*="w-80"]');
        const removeBtn = sidebar?.querySelector('[class*="destructive"]');

        expect(removeBtn).toBeDefined();
        await user.click(removeBtn as Element);

        expect(onRemoveFromGroup).toHaveBeenCalledWith('g1', 'pe1');
    });
});

/* ── Testes — colapsar grupo na sidebar ── */

describe('StepSelectExercises — colapsar grupo na sidebar', () => {
    it('esconde exercícios e botão ao colapsar o grupo', async () => {
        const user = userEvent.setup();
        const ex1 = makeProgramExercise({
            id: 'pe1',
            exerciseId: '1',
            title: 'Agachamento',
        });
        const groups = [
            makeGroup({ id: 'g1', name: 'Aquecimento', exercises: [ex1] }),
        ];

        renderStep({
            exercises: [makeExercise({ id: '1', title: 'Agachamento' })],
            selectedIds: ['1'],
            groups,
        });

        // Verificar que "Adicionar exercícios nesse grupo" está visível
        expect(
            screen.getByText('Adicionar exercícios nesse grupo'),
        ).toBeInTheDocument();

        // Clicar no botão de collapse no header do grupo da sidebar
        const groupHeader = screen
            .getByText('Aquecimento')
            .closest('[class*="flex items-center"]');
        const collapseBtn = groupHeader?.querySelector('button');

        // O último botão no group header é o collapse
        const headerButtons = groupHeader?.querySelectorAll('button') ?? [];
        const lastBtn = Array.from(headerButtons).pop();

        expect(lastBtn).toBeDefined();
        await user.click(lastBtn!);

        // Após colapsar, "Adicionar exercícios nesse grupo" deve sumir
        expect(
            screen.queryByText('Adicionar exercícios nesse grupo'),
        ).not.toBeInTheDocument();
    });
});
