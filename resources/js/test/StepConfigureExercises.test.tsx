import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi, type Mock } from 'vitest';

import { StepConfigureExercises } from '@/components/clinic/program/StepConfigureExercises';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';

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

    Element.prototype.getBoundingClientRect = vi.fn(() => ({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        top: 0,
        right: 100,
        bottom: 50,
        left: 0,
        toJSON: () => {},
    }));

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

function makeExercise(overrides: Partial<ProgramExercise> = {}): ProgramExercise {
    const id = overrides.id ?? `ex-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id,
        exerciseId: id,
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

function renderStep(
    groups: ProgramGroup[],
    overrides: Partial<Parameters<typeof StepConfigureExercises>[0]> = {},
) {
    const onUpdateGroups = overrides.onUpdateGroups ?? vi.fn();
    const onEditExercise = overrides.onEditExercise ?? vi.fn();
    const onNext = overrides.onNext ?? vi.fn();
    const onBack = overrides.onBack ?? vi.fn();

    const result = render(
        <TooltipProvider>
            <StepConfigureExercises
                groups={groups}
                onUpdateGroups={onUpdateGroups}
                onEditExercise={onEditExercise}
                onNext={onNext}
                onBack={onBack}
            />
        </TooltipProvider>,
    );

    return { ...result, onUpdateGroups, onEditExercise, onNext, onBack };
}

/* ── Testes — renderização ── */

describe('StepConfigureExercises — renderização', () => {
    it('exibe o progresso de exercícios editados', () => {
        const ex1 = makeExercise({ id: 'e1', title: 'Agachamento', isConfigured: true });
        const ex2 = makeExercise({ id: 'e2', title: 'Flexão', isConfigured: false });
        const group = makeGroup({ id: 'g1', exercises: [ex1, ex2] });

        renderStep([group]);

        expect(screen.getByText('1 de 2 editados')).toBeInTheDocument();
    });

    it('exibe o nome do grupo e a contagem de exercícios', () => {
        const ex1 = makeExercise({ id: 'e1', title: 'Agachamento' });
        const group = makeGroup({ id: 'g1', name: 'Série A', exercises: [ex1] });

        renderStep([group]);

        expect(screen.getByText('Série A')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('exibe exercícios com título e descrição', () => {
        const ex = makeExercise({ id: 'e1', title: 'Bird Dog', isConfigured: false });
        const group = makeGroup({ id: 'g1', exercises: [ex] });

        renderStep([group]);

        expect(screen.getByText('Bird Dog')).toBeInTheDocument();
        expect(screen.getByText('Sem especificações')).toBeInTheDocument();
    });

    it('exibe descrição formatada para exercício configurado', () => {
        const ex = makeExercise({
            id: 'e1',
            title: 'Agachamento',
            isConfigured: true,
            seriesMin: 3,
            seriesMax: 3,
            repetitionsMin: 12,
            repetitionsMax: 12,
        });
        const group = makeGroup({ id: 'g1', exercises: [ex] });

        renderStep([group]);

        expect(screen.getByText('Frequência: 3 séries, 12 repetições')).toBeInTheDocument();
    });

    it('exibe botão "Adicionar novo grupo"', () => {
        renderStep([makeGroup({ id: 'g1' })]);
        expect(screen.getByText('Adicionar novo grupo')).toBeInTheDocument();
    });

    it('exibe botão "Adicionar exercícios"', () => {
        renderStep([makeGroup({ id: 'g1' })]);
        expect(screen.getByText('Adicionar exercícios')).toBeInTheDocument();
    });

    it('exibe placeholder em grupo vazio', () => {
        renderStep([makeGroup({ id: 'g1', exercises: [] })]);
        expect(screen.getByText('Arraste exercícios para este grupo')).toBeInTheDocument();
    });
});

/* ── Testes — adicionar grupo ── */

describe('StepConfigureExercises — adicionar grupo', () => {
    it('chama onUpdateGroups com novo grupo vazio ao clicar "Adicionar novo grupo"', async () => {
        const user = userEvent.setup();
        const existingGroup = makeGroup({ id: 'g1', name: 'Grupo A', exercises: [] });
        const { onUpdateGroups } = renderStep([existingGroup]);

        await user.click(screen.getByText('Adicionar novo grupo'));

        expect(onUpdateGroups).toHaveBeenCalledOnce();
        const newGroups = (onUpdateGroups as Mock).mock.calls[0][0] as ProgramGroup[];
        expect(newGroups).toHaveLength(2);
        expect(newGroups[0].id).toBe('g1');
        expect(newGroups[1].name).toBe('Novo grupo');
        expect(newGroups[1].exercises).toEqual([]);
    });
});

/* ── Testes — excluir grupo ── */

describe('StepConfigureExercises — excluir grupo', () => {
    it('não exibe botão excluir com apenas 1 grupo', () => {
        const group = makeGroup({ id: 'g1', name: 'Grupo A', exercises: [] });
        renderStep([group]);

        // Com 1 grupo vazio, os únicos botões são: Voltar, Avançar, AddGrupo, EditableName, Copy(grupo), Chevron, AddExercicios
        // NÃO deve ter trash no header do grupo
        const allButtons = screen.getAllByRole('button');
        const trashButtons = allButtons.filter((btn) =>
            btn.className.includes('hover:text-destructive'),
        );
        expect(trashButtons).toHaveLength(0);
    });

    it('chama onUpdateGroups sem o grupo excluído', async () => {
        const user = userEvent.setup();
        const group1 = makeGroup({ id: 'g1', name: 'Grupo A', exercises: [] });
        const group2 = makeGroup({ id: 'g2', name: 'Grupo B', exercises: [] });
        const { onUpdateGroups } = renderStep([group1, group2]);

        // Com 2 grupos vazios, os botões trash aparecem nos headers
        const allButtons = screen.getAllByRole('button');
        const trashButtons = allButtons.filter((btn) =>
            btn.className.includes('hover:text-destructive'),
        );
        // Deve ter exatamente 2 botões trash (1 por grupo header)
        expect(trashButtons).toHaveLength(2);

        // Clicar no trash do primeiro grupo
        await user.click(trashButtons[0]);

        expect(onUpdateGroups).toHaveBeenCalledWith([group2]);
    });
});

/* ── Testes — remover exercício ── */

describe('StepConfigureExercises — remover exercício', () => {
    it('chama onUpdateGroups sem o exercício removido', async () => {
        const user = userEvent.setup();
        const ex1 = makeExercise({ id: 'e1', title: 'Agachamento' });
        const ex2 = makeExercise({ id: 'e2', title: 'Flexão' });
        const group = makeGroup({ id: 'g1', exercises: [ex1, ex2] });
        const { onUpdateGroups } = renderStep([group]);

        // Encontrar o botão trash na row do exercício "Agachamento"
        const agachamentoText = screen.getByText('Agachamento');
        const exerciseRow = agachamentoText.closest('[class*="rounded-lg border p-4"]');
        const rowButtons = exerciseRow?.querySelectorAll('button') ?? [];
        const trashBtn = Array.from(rowButtons).find((btn) =>
            btn.className.includes('destructive'),
        );

        expect(trashBtn).toBeDefined();
        await user.click(trashBtn!);

        expect(onUpdateGroups).toHaveBeenCalledOnce();
        const updated = (onUpdateGroups as Mock).mock.calls[0][0] as ProgramGroup[];
        expect(updated[0].exercises).toHaveLength(1);
        expect(updated[0].exercises[0].id).toBe('e2');
    });
});

/* ── Testes — duplicar exercício ── */

describe('StepConfigureExercises — duplicar exercício', () => {
    it('chama onUpdateGroups com exercício duplicado após o original', async () => {
        const user = userEvent.setup();
        const ex = makeExercise({ id: 'e1', title: 'Agachamento' });
        const group = makeGroup({ id: 'g1', exercises: [ex] });
        const { onUpdateGroups } = renderStep([group]);

        // Encontrar o botão de duplicar na row do exercício
        const agachamentoText = screen.getByText('Agachamento');
        const exerciseRow = agachamentoText.closest('[class*="rounded-lg border p-4"]');
        const rowButtons = exerciseRow?.querySelectorAll('button') ?? [];
        // Ordem dos botões na row: play(video), Settings2, Trash2, Copy
        // O último botão é Copy (duplicar exercício)
        const allRowButtons = Array.from(rowButtons);
        const copyBtn = allRowButtons[allRowButtons.length - 1];

        expect(copyBtn).toBeDefined();
        await user.click(copyBtn!);

        expect(onUpdateGroups).toHaveBeenCalledOnce();
        const updated = (onUpdateGroups as Mock).mock.calls[0][0] as ProgramGroup[];
        expect(updated[0].exercises).toHaveLength(2);
        expect(updated[0].exercises[0].id).toBe('e1');
        expect(updated[0].exercises[1].id).toContain('copy');
        expect(updated[0].exercises[1].isConfigured).toBe(false);
    });
});

/* ── Testes — colapsar grupo ── */

describe('StepConfigureExercises — colapsar grupo', () => {
    it('esconde exercícios ao colapsar o grupo', async () => {
        const user = userEvent.setup();
        const ex = makeExercise({ id: 'e1', title: 'Bird Dog' });
        const group = makeGroup({ id: 'g1', name: 'Grupo A', exercises: [ex] });
        renderStep([group]);

        expect(screen.getByText('Bird Dog')).toBeInTheDocument();

        // O botão de collapse é o último botão no header do grupo
        // Header do grupo com 1 grupo: EditableName, Badge, Copy(grupo), Chevron
        // (sem Trash porque só 1 grupo)
        const groupNameBtn = screen.getByText('Grupo A');
        const groupHeader = groupNameBtn.closest('[class*="flex items-center gap-2"]');
        const headerButtons = groupHeader?.querySelectorAll('button') ?? [];
        const chevronBtn = Array.from(headerButtons).pop();

        expect(chevronBtn).toBeDefined();
        await user.click(chevronBtn!);

        expect(screen.queryByText('Bird Dog')).not.toBeInTheDocument();
    });
});

/* ── Testes — navegação ── */

describe('StepConfigureExercises — navegação', () => {
    it('chama onBack ao clicar em "Voltar"', async () => {
        const user = userEvent.setup();
        const { onBack } = renderStep([makeGroup({ id: 'g1' })]);

        await user.click(screen.getByRole('button', { name: /^voltar$/i }));

        expect(onBack).toHaveBeenCalledOnce();
    });

    it('chama onNext ao clicar em "Avançar"', async () => {
        const user = userEvent.setup();
        const { onNext } = renderStep([makeGroup({ id: 'g1' })]);

        await user.click(screen.getByRole('button', { name: /avançar/i }));

        expect(onNext).toHaveBeenCalledOnce();
    });

    it('chama onBack ao clicar em "Adicionar exercícios"', async () => {
        const user = userEvent.setup();
        const { onBack } = renderStep([makeGroup({ id: 'g1' })]);

        await user.click(screen.getByText('Adicionar exercícios'));

        expect(onBack).toHaveBeenCalledOnce();
    });
});

/* ── Testes — renomear grupo ── */

describe('StepConfigureExercises — renomear grupo', () => {
    it('permite renomear o grupo inline', async () => {
        const user = userEvent.setup();
        const group = makeGroup({ id: 'g1', name: 'Série A', exercises: [] });
        const { onUpdateGroups } = renderStep([group]);

        // Clicar no nome do grupo para editar
        await user.click(screen.getByText('Série A'));

        // Input deve aparecer com o valor atual
        const input = screen.getByDisplayValue('Série A');
        expect(input).toBeInTheDocument();

        // Limpar e digitar novo nome
        await user.clear(input);
        await user.type(input, 'Aquecimento');
        await user.keyboard('{Enter}');

        expect(onUpdateGroups).toHaveBeenCalledWith([
            expect.objectContaining({ id: 'g1', name: 'Aquecimento' }),
        ]);
    });
});

/* ── Testes — editar exercício ── */

describe('StepConfigureExercises — editar exercício', () => {
    it('chama onEditExercise ao clicar no botão configurar', async () => {
        const user = userEvent.setup();
        const ex = makeExercise({ id: 'e1', title: 'Agachamento' });
        const group = makeGroup({ id: 'g1', exercises: [ex] });
        const { onEditExercise } = renderStep([group]);

        // O botão configurar (Settings2) na row tem variant="default"
        const agachamentoText = screen.getByText('Agachamento');
        const exerciseRow = agachamentoText.closest('[class*="rounded-lg border p-4"]');
        const rowButtons = exerciseRow?.querySelectorAll('button') ?? [];
        // Encontrar o botão com a classe do variant default (bg-primary)
        const configBtn = Array.from(rowButtons).find(
            (btn) =>
                btn.className.includes('cursor-pointer') &&
                !btn.className.includes('destructive') &&
                !btn.className.includes('ghost'),
        );

        expect(configBtn).toBeDefined();
        await user.click(configBtn!);

        expect(onEditExercise).toHaveBeenCalledWith('g1', 'e1');
    });
});
