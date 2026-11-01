import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { CollapseItem, Tab } from '@/components/ds';
import {
    DsCollapse,
    DsPagination,
    DsSteps,
    DsTabs,
    DsTabsPanel,
} from '@/components/ds';

const ITEMS: CollapseItem[] = [
    { key: 'a', title: 'Primeiro', content: <p>Detalhe A</p> },
    { key: 'b', title: 'Segundo', content: <p>Detalhe B</p> },
];

describe('DsCollapse', () => {
    it('renderiza um item por entrada, todos fechados', () => {
        render(<DsCollapse items={ITEMS} />);

        const triggers = screen.getAllByRole('button');
        expect(triggers.map((t) => t.textContent)).toEqual([
            'Primeiro',
            'Segundo',
        ]);
        expect(triggers[0]).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByText('Detalhe A')).not.toBeInTheDocument();
    });

    it('clicar abre o item, mostra o conteúdo e chama onValueChange', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsCollapse items={ITEMS} onValueChange={onValueChange} />);

        await user.click(screen.getByRole('button', { name: 'Primeiro' }));

        expect(
            screen.getByRole('button', { name: 'Primeiro' }),
        ).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByText('Detalhe A')).toBeInTheDocument();
        expect(onValueChange).toHaveBeenLastCalledWith('a');
    });

    it('clicar de novo fecha e emite null', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsCollapse items={ITEMS} onValueChange={onValueChange} />);

        await user.click(screen.getByRole('button', { name: 'Primeiro' }));
        await user.click(screen.getByRole('button', { name: 'Primeiro' }));

        expect(onValueChange.mock.calls).toEqual([['a'], [null]]);
        await waitFor(() =>
            expect(screen.queryByText('Detalhe A')).not.toBeInTheDocument(),
        );
    });

    it('abrir outro troca o aberto (um por vez)', async () => {
        const user = userEvent.setup();
        render(<DsCollapse items={ITEMS} />);

        await user.click(screen.getByRole('button', { name: 'Primeiro' }));
        await user.click(screen.getByRole('button', { name: 'Segundo' }));

        expect(
            screen.getByRole('button', { name: 'Primeiro' }),
        ).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: 'Segundo' })).toHaveAttribute(
            'aria-expanded',
            'true',
        );
    });

    it('com value={null} do pai, clicar avisa mas não abre sozinho', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsCollapse
                items={ITEMS}
                value={null}
                onValueChange={onValueChange}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Primeiro' }));

        expect(onValueChange).toHaveBeenCalledWith('a');
        expect(
            screen.getByRole('button', { name: 'Primeiro' }),
        ).toHaveAttribute('aria-expanded', 'false');
    });

    it('respeita o valor controlado pelo pai (inclusive null)', () => {
        const { rerender } = render(<DsCollapse items={ITEMS} value="b" />);
        expect(screen.getByText('Detalhe B')).toBeInTheDocument();

        rerender(<DsCollapse items={ITEMS} value={null} />);
        expect(screen.queryByText('Detalhe B')).not.toBeInTheDocument();
    });

    it('teclado: Enter e Espaço abrem e fecham; setas passam ao próximo título', async () => {
        const user = userEvent.setup();
        render(<DsCollapse items={ITEMS} />);

        await user.tab();
        await user.keyboard('{Enter}');
        expect(screen.getByText('Detalhe A')).toBeInTheDocument();

        await user.keyboard(' ');
        await waitFor(() =>
            expect(screen.queryByText('Detalhe A')).not.toBeInTheDocument(),
        );

        await user.keyboard('{ArrowDown}');
        expect(screen.getByRole('button', { name: 'Segundo' })).toHaveFocus();
    });

    it('mode="step" marca feito, atual e pendente pelo currentStep', () => {
        render(
            <DsCollapse
                mode="step"
                currentStep={1}
                items={[...ITEMS, { key: 'c', title: 'Terceiro' }]}
            />,
        );

        const triggers = screen.getAllByRole('button');
        expect(triggers[0]).toHaveAttribute('data-step', 'done');
        expect(triggers[1]).toHaveAttribute('data-step', 'current');
        expect(triggers[2]).toHaveAttribute('data-step', 'pending');
        expect(
            within(triggers[0]).getByTestId('ds-step-check'),
        ).toBeInTheDocument();
        expect(triggers[2]).toHaveTextContent('3');
    });
});

const TABS: Tab[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'avancado', label: 'Avançado', icon: <Star data-testid="icone" /> },
    { key: 'bloqueado', label: 'Bloqueado', disabled: true },
];

describe('DsTabs', () => {
    it('renderiza as abas dentro de um tablist, md por padrão', () => {
        render(<DsTabs tabs={TABS} />);

        const tablist = screen.getByRole('tablist');
        expect(tablist).toHaveAttribute('data-size', 'md');
        expect(within(tablist).getAllByRole('tab')).toHaveLength(3);
        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });

    it('a primeira aba fica ativa quando não há valor', () => {
        render(<DsTabs tabs={TABS} />);

        expect(screen.getByRole('tab', { name: 'Geral' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

    it('marca a aba do valor e chama onValueChange ao clicar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsTabs
                tabs={TABS}
                value="avancado"
                onValueChange={onValueChange}
            />,
        );

        expect(screen.getByRole('tab', { name: 'Avançado' })).toHaveAttribute(
            'aria-selected',
            'true',
        );
        expect(screen.getByRole('tab', { name: 'Geral' })).toHaveAttribute(
            'aria-selected',
            'false',
        );

        await user.click(screen.getByRole('tab', { name: 'Geral' }));
        expect(onValueChange).toHaveBeenCalledWith('geral');
    });

    it('aba disabled não é ativada', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsTabs tabs={TABS} onValueChange={onValueChange} />);

        const disabled = screen.getByRole('tab', { name: 'Bloqueado' });
        await user.click(disabled);

        expect(disabled).toBeDisabled();
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('aplica o tamanho', () => {
        render(<DsTabs tabs={TABS} size="lg" />);

        expect(screen.getByRole('tablist')).toHaveAttribute('data-size', 'lg');
    });

    it('setas trocam a aba (e pulam a disabled)', async () => {
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState('geral');
            return (
                <DsTabs tabs={TABS} value={value} onValueChange={setValue} />
            );
        }
        render(<Controlled />);

        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('tab', { name: 'Avançado' })).toHaveAttribute(
            'aria-selected',
            'true',
        );

        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('tab', { name: 'Geral' })).toHaveFocus();
    });

    it('DsTabsPanel mostra o conteúdo da aba ativa', async () => {
        const user = userEvent.setup();
        render(
            <DsTabs tabs={TABS}>
                <DsTabsPanel value="geral">Painel geral</DsTabsPanel>
                <DsTabsPanel value="avancado">Painel avançado</DsTabsPanel>
            </DsTabs>,
        );

        expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel geral');
        await user.click(screen.getByRole('tab', { name: 'Avançado' }));
        expect(screen.getByRole('tabpanel')).toHaveTextContent(
            'Painel avançado',
        );
    });
});

const STEPS = [
    { label: 'Conta', description: 'Dados de acesso' },
    { label: 'Perfil' },
    { label: 'Pagamento' },
    { label: 'Revisão' },
];

describe('DsSteps', () => {
    it('com onStepClick, cada passo vira botão e avisa o índice', async () => {
        const onStepClick = vi.fn();
        const user = userEvent.setup();
        render(<DsSteps steps={STEPS} current={1} onStepClick={onStepClick} />);

        await user.click(screen.getByRole('button', { name: /Pagamento/ }));

        expect(onStepClick).toHaveBeenCalledWith(2);
    });

    it('sem onStepClick, nenhum passo é botão', () => {
        render(<DsSteps steps={STEPS} />);

        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('renderiza um item por passo com os rótulos', () => {
        render(<DsSteps steps={STEPS} />);

        const items = screen.getAllByRole('listitem');
        expect(items).toHaveLength(4);
        expect(items.map((i) => i.textContent)).toEqual([
            '1ContaDados de acesso',
            '2Perfil',
            '3Pagamento',
            '4Revisão',
        ]);
    });

    it('current=0 por padrão, com aria-current="step"', () => {
        render(<DsSteps steps={STEPS} />);

        const items = screen.getAllByRole('listitem');
        expect(items[0]).toHaveAttribute('data-state', 'current');
        expect(items[0]).toHaveAttribute('aria-current', 'step');
    });

    it('marca feitos, atual e pendentes; check nos feitos e número nos demais', () => {
        render(<DsSteps steps={STEPS} current={2} />);

        const items = screen.getAllByRole('listitem');
        expect(items.map((i) => i.getAttribute('data-state'))).toEqual([
            'done',
            'done',
            'current',
            'pending',
        ]);
        expect(
            within(items[0]).getByTestId('ds-step-check'),
        ).toBeInTheDocument();
        expect(
            within(items[2]).queryByTestId('ds-step-check'),
        ).not.toBeInTheDocument();
        expect(items[3]).not.toHaveAttribute('aria-current');
        expect(within(items[0]).getByText('(concluído)')).toHaveClass(
            'sr-only',
        );
    });

    it('vertical', () => {
        render(<DsSteps steps={STEPS} vertical />);

        expect(screen.getByRole('list')).toHaveAttribute(
            'data-vertical',
            'true',
        );
    });
});

function controls() {
    return within(screen.getByTestId('ds-pagination-controls'));
}

describe('DsPagination', () => {
    it('calcula as páginas a partir de total e perPage (arredonda para cima)', () => {
        const { rerender } = render(<DsPagination total={100} perPage={20} />);
        expect(
            controls().getAllByRole('button', { name: /^\d+$/ }),
        ).toHaveLength(5);

        rerender(<DsPagination total={45} perPage={20} />);
        expect(
            controls().getAllByRole('button', { name: /^\d+$/ }),
        ).toHaveLength(3);

        rerender(<DsPagination total={0} />);
        expect(
            controls().getAllByRole('button', { name: /^\d+$/ }),
        ).toHaveLength(1);
    });

    it('chama onPageChange com a página clicada', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        render(<DsPagination total={100} onPageChange={onPageChange} />);

        await user.click(controls().getByRole('button', { name: '3' }));

        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('Anterior desabilitado na primeira e Próxima na última', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        const { rerender } = render(
            <DsPagination total={100} page={1} onPageChange={onPageChange} />,
        );
        const prev = controls().getByRole('button', {
            name: 'Página anterior',
        });
        expect(prev).toBeDisabled();
        await user.click(prev);

        rerender(
            <DsPagination total={100} page={5} onPageChange={onPageChange} />,
        );
        expect(
            controls().getByRole('button', { name: 'Próxima página' }),
        ).toBeDisabled();
        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('Anterior e Próxima andam uma página', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsPagination total={100} page={3} onPageChange={onPageChange} />,
        );

        await user.click(
            controls().getByRole('button', { name: 'Página anterior' }),
        );
        await user.click(
            controls().getByRole('button', { name: 'Próxima página' }),
        );

        expect(onPageChange.mock.calls).toEqual([[2], [4]]);
    });

    it('sem reticências até 7 páginas; com reticências acima', () => {
        const { rerender } = render(<DsPagination total={140} />);
        expect(
            controls().getAllByRole('button', { name: /^\d+$/ }),
        ).toHaveLength(7);
        expect(controls().queryByText('…')).not.toBeInTheDocument();

        rerender(<DsPagination total={400} page={10} />);
        const sequence = Array.from(
            screen
                .getByTestId('ds-pagination-controls')
                .querySelectorAll('button, [data-ds-pagination-gap]'),
        ).map((el) => el.textContent);
        expect(sequence).toEqual([
            'Anterior',
            '1',
            '…',
            '9',
            '10',
            '11',
            '…',
            '20',
            'Próxima',
        ]);
    });

    it('reticências não são clicáveis', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsPagination total={400} page={10} onPageChange={onPageChange} />,
        );

        const ellipsis = controls().getAllByText('…')[0];
        expect(ellipsis.closest('button')).toBeNull();
        expect(ellipsis).toHaveAttribute('aria-hidden', 'true');
        expect(
            controls().queryByRole('button', { name: '…' }),
        ).not.toBeInTheDocument();
        await user.click(ellipsis);
        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('marca a página atual com aria-current', () => {
        render(<DsPagination total={100} page={3} />);

        expect(controls().getByRole('button', { name: '3' })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });

    it('resumo com intervalo e itemLabel', () => {
        const { rerender } = render(<DsPagination total={100} />);
        expect(screen.getByText('1–20 de 100 itens')).toBeInTheDocument();

        rerender(<DsPagination total={100} page={3} />);
        expect(screen.getByText('41–60 de 100 itens')).toBeInTheDocument();

        rerender(<DsPagination total={45} page={3} itemLabel="pacientes" />);
        expect(screen.getByText('41–45 de 45 pacientes')).toBeInTheDocument();
    });

    it('resumo com total zero mostra "0 de 0"', () => {
        render(<DsPagination total={0} itemLabel="pacientes" />);

        expect(screen.getByText('0 de 0 pacientes')).toBeInTheDocument();
        expect(screen.queryByText(/1–0/)).not.toBeInTheDocument();
    });

    it('enquanto a lista carrega (total 0) não corrige a página; depois mantém a página pedida', () => {
        const onPageChange = vi.fn();
        const { rerender } = render(
            <DsPagination total={0} page={3} onPageChange={onPageChange} />,
        );

        rerender(
            <DsPagination total={100} page={3} onPageChange={onPageChange} />,
        );

        expect(onPageChange).not.toHaveBeenCalled();
        expect(controls().getByRole('button', { name: '3' })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });

    it('page não numérico (lixo na URL) vira a página 1 e avisa o pai', () => {
        const onPageChange = vi.fn();
        render(
            <DsPagination
                total={45}
                page={Number.NaN}
                onPageChange={onPageChange}
            />,
        );

        expect(onPageChange).toHaveBeenCalledWith(1);
        expect(screen.getByText('1–20 de 45 itens')).toBeInTheDocument();
    });

    it.each([
        ['total NaN', Number.NaN, 20],
        ['total Infinity', Number.POSITIVE_INFINITY, 20],
        ['perPage 0', 45, 0],
    ])('%s não quebra e não mostra página "NaN"', (_caso, total, perPage) => {
        render(<DsPagination total={total} perPage={perPage} />);

        expect(
            screen.queryByRole('button', { name: 'NaN' }),
        ).not.toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: 'Próxima página' }),
        ).not.toHaveLength(0);
    });

    it('page acima do total avisa o pai com a última página', () => {
        const onPageChange = vi.fn();
        render(
            <DsPagination total={45} page={10} onPageChange={onPageChange} />,
        );

        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it('page abaixo de 1 avisa o pai com a primeira página', () => {
        const onPageChange = vi.fn();
        render(
            <DsPagination total={45} page={0} onPageChange={onPageChange} />,
        );

        expect(onPageChange).toHaveBeenCalledTimes(1);
        expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it('correção da página não entra em loop com pai controlado', () => {
        const onPageChange = vi.fn();
        function Controlled() {
            const [page, setPage] = useState(10);
            return (
                <DsPagination
                    total={45}
                    page={page}
                    onPageChange={(next) => {
                        onPageChange(next);
                        setPage(next);
                    }}
                />
            );
        }
        render(<Controlled />);

        expect(onPageChange.mock.calls).toEqual([[3]]);
        expect(controls().getByRole('button', { name: '3' })).toHaveAttribute(
            'aria-current',
            'page',
        );
    });

    it('page dentro do intervalo não chama onPageChange ao montar', () => {
        const onPageChange = vi.fn();
        render(
            <DsPagination total={45} page={3} onPageChange={onPageChange} />,
        );

        expect(onPageChange).not.toHaveBeenCalled();
    });

    it('compact esconde o resumo e o texto dos botões', () => {
        render(<DsPagination total={100} compact />);

        expect(screen.queryByText(/de 100 itens/)).not.toBeInTheDocument();
        expect(
            controls().getByRole('button', { name: 'Página anterior' }),
        ).not.toHaveTextContent('Anterior');
    });

    it('versão mobile: select de página', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        render(<DsPagination total={100} onPageChange={onPageChange} />);

        await user.selectOptions(
            screen.getByRole('combobox', { name: 'Selecionar página' }),
            '4',
        );

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('teclado: Tab chega nas páginas e Enter troca', async () => {
        const onPageChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsPagination total={100} page={1} onPageChange={onPageChange} />,
        );

        await user.tab();
        expect(controls().getByRole('button', { name: '1' })).toHaveFocus();
        await user.tab();
        await user.keyboard('{Enter}');

        expect(onPageChange).toHaveBeenCalledWith(2);
    });
});
