import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DsDatepicker } from '@/components/ds/datepicker/DsDatepicker';
import type {
    DatepickerValue,
    DateRange,
} from '@/components/ds/datepicker/types';

// "Hoje" fixo em 25/06/2025: os testes não dependem do dia em que rodam.
// A âncora (15/06) fica no mesmo mês, mas não é hoje nem ontem.
const NOW = new Date(2025, 5, 25, 10, 0, 0);
const ANCHOR = new Date(2025, 5, 15);

function setup() {
    return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

/** O gatilho é o único botão com aria-haspopup fora do painel. */
function trigger() {
    return screen
        .getAllByRole('button')
        .find((b) => b.getAttribute('aria-haspopup') === 'dialog')!;
}

async function panel() {
    return screen.findByRole('dialog');
}

/** Botão do dia (do mês exibido, não os dias "de fora" da grade). */
function day(dayOfMonth: number, month = 'junho', year = 2025) {
    const name = new RegExp(`\\b${dayOfMonth} de ${month} de ${year}`);
    const match = screen
        .getAllByRole('button', { name })
        .filter(
            (button) =>
                !button
                    .closest('[role="gridcell"]')
                    ?.hasAttribute('data-outside'),
        );
    expect(match).toHaveLength(1);
    return match[0];
}

function titles() {
    return screen
        .getAllByRole('grid')
        .map((grid) => grid.getAttribute('aria-label'));
}

function Controlled({
    initial,
    onValueChange,
    ...rest
}: Omit<Parameters<typeof DsDatepicker>[0], 'value' | 'onValueChange'> & {
    initial?: DatepickerValue;
    onValueChange?: (value: DatepickerValue) => void;
}) {
    const [value, setValue] = useState<DatepickerValue>(initial ?? null);
    return (
        <DsDatepicker
            {...rest}
            value={value}
            onValueChange={(next) => {
                setValue(next);
                onValueChange?.(next);
            }}
        />
    );
}

describe('DsDatepicker', () => {
    beforeEach(() => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── Casos portados do DsDatepicker.test.ts (Vue) ──

    it('o trigger mostra o placeholder quando vazio', () => {
        render(<DsDatepicker placeholder="Escolha um período" />);

        expect(trigger()).toHaveTextContent('Escolha um período');
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('clicar no trigger abre o painel; clicar novamente fecha', async () => {
        const user = setup();
        render(<DsDatepicker />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

        await user.click(trigger());
        expect(await panel()).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
        expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog');

        await user.click(trigger());
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
    });

    it('clicar fora fecha o painel', async () => {
        const user = setup();
        render(<DsDatepicker />);
        await user.click(trigger());
        await panel();

        await user.click(document.body);
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('mode="single": clicar num dia emite Date e fecha', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="single"
                value={ANCHOR}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        await user.click(day(10));

        expect(onValueChange).toHaveBeenCalledTimes(1);
        const value = onValueChange.mock.calls[0][0] as Date;
        expect(value).toBeInstanceOf(Date);
        expect(value.getFullYear()).toBe(2025);
        expect(value.getMonth()).toBe(5);
        expect(value.getDate()).toBe(10);
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('mode="range": dois cliques definem o intervalo; Aplicar emite {start,end}', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: null }}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        await user.click(day(10));
        // Primeiro clique não fecha nem emite
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(onValueChange).not.toHaveBeenCalled();

        await user.click(day(20));
        // Segundo clique define o fim, mas espera o Aplicar
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(onValueChange).not.toHaveBeenCalled();

        expect(day(10)).toHaveAttribute('data-range-start');
        expect(day(20)).toHaveAttribute('data-range-end');
        expect(day(15)).toHaveAttribute('data-in-range');

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));

        expect(onValueChange).toHaveBeenCalledTimes(1);
        const value = onValueChange.mock.calls[0][0] as DateRange;
        expect(value.start).toBeInstanceOf(Date);
        expect(value.end).toBeInstanceOf(Date);
        expect(value.start!.getDate()).toBe(10);
        expect(value.end!.getDate()).toBe(20);
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
    });

    it('mode="range": Cancelar fecha sem emitir', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: null }}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        await user.click(day(10));
        await user.click(day(20));
        await user.click(screen.getByRole('button', { name: 'Cancelar' }));

        expect(onValueChange).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        // A seleção não confirmada some: o campo volta ao valor de antes.
        expect(trigger()).toHaveTextContent('15 Jun 2025 — ...');
    });

    it('a sidebar de presets é renderizada no modo range', async () => {
        const user = setup();
        render(
            <DsDatepicker mode="range" value={{ start: ANCHOR, end: null }} />,
        );
        await user.click(trigger());
        const dialog = await panel();

        const presets = within(
            within(dialog).getByRole('group', { name: 'Selecionar data' }),
        ).getAllByRole('button');
        const labels = presets.map((p) => p.textContent);
        expect(labels.length).toBeGreaterThan(0);
        expect(labels).toContain('Hoje');
        expect(labels).toContain('Intervalo de Datas');
    });

    it('intervalo de um dia igual a hoje mostra "Hoje, dd/mm/aaaa" no trigger', () => {
        const today = new Date(2025, 5, 25);
        render(
            <DsDatepicker mode="range" value={{ start: today, end: today }} />,
        );

        expect(trigger()).toHaveTextContent('Hoje, 25/06/2025');
    });

    it('preset "Ontem" mostra "Ontem, dd/mm/aaaa" no trigger', async () => {
        const user = setup();
        render(<DsDatepicker mode="range" />);
        await user.click(trigger());
        await panel();

        await user.click(screen.getByRole('button', { name: 'Ontem' }));

        expect(trigger()).toHaveTextContent('Ontem, 24/06/2025');
    });

    it('intervalo de um dia que não é hoje/ontem mantém o formato de intervalo', () => {
        render(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: ANCHOR }}
            />,
        );

        expect(trigger()).toHaveTextContent('15 Jun 2025 — 15 Jun 2025');
    });

    it('não permite selecionar uma data posterior à data máxima', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: null }}
                maxDate={ANCHOR}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        const futureDay = day(20);
        expect(futureDay).toBeDisabled();
        await user.click(futureDay);

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));

        const range = onValueChange.mock.calls[0][0] as DateRange;
        expect(range.start).toEqual(ANCHOR);
        expect(range.end).toBeNull();
    });

    it('modo single não renderiza a sidebar de presets', async () => {
        const user = setup();
        render(<DsDatepicker mode="single" value={ANCHOR} />);
        await user.click(trigger());
        const dialog = await panel();

        expect(
            within(dialog).queryByRole('group', { name: 'Selecionar data' }),
        ).not.toBeInTheDocument();
        expect(
            within(dialog).queryByRole('button', { name: 'Hoje' }),
        ).not.toBeInTheDocument();
    });

    it('navegação de mês anterior/próximo atualiza os títulos do calendário', async () => {
        const user = setup();
        render(
            <DsDatepicker mode="range" value={{ start: ANCHOR, end: null }} />,
        );
        await user.click(trigger());
        await panel();

        expect(screen.getByText('Junho 2025')).toBeInTheDocument();
        expect(titles()).toEqual(['Junho 2025', 'Julho 2025']);

        await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
        expect(titles()).toEqual(['Julho 2025', 'Agosto 2025']);

        await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
        expect(titles()).toEqual(['Junho 2025', 'Julho 2025']);
    });

    // ── Casos novos ──

    it('datas fora de minDate e maxDate ficam desabilitadas', async () => {
        const user = setup();
        render(
            <DsDatepicker
                mode="single"
                value={ANCHOR}
                minDate={new Date(2025, 5, 10)}
                maxDate={new Date(2025, 5, 20)}
            />,
        );
        await user.click(trigger());
        await panel();

        expect(day(9)).toBeDisabled();
        expect(day(9)).toHaveAttribute('data-disabled');
        expect(day(10)).toBeEnabled();
        expect(day(20)).toBeEnabled();
        expect(day(21)).toBeDisabled();
        // Não volta para antes do mês do minDate
        expect(
            screen.getByRole('button', { name: 'Mês anterior' }),
        ).toBeDisabled();
    });

    it('minDate e maxDate inválidas são ignoradas: os dias continuam escolhíveis', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="single"
                value={ANCHOR}
                minDate={new Date('lixo')}
                maxDate={new Date('lixo')}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        expect(day(1)).toBeEnabled();
        expect(day(30)).toBeEnabled();
        expect(
            screen.getByRole('button', { name: 'Mês anterior' }),
        ).toBeEnabled();
        expect(
            screen.getByRole('button', { name: 'Próximo mês' }),
        ).toBeEnabled();

        // As setas andam para os dois lados sem bater num limite inválido
        await waitFor(() => expect(day(15)).toHaveFocus());
        await user.keyboard('{ArrowLeft}');
        expect(day(14)).toHaveFocus();
        await user.keyboard('{ArrowRight}{ArrowRight}');
        expect(day(16)).toHaveFocus();

        await user.click(day(10));

        expect(onValueChange).toHaveBeenCalledTimes(1);
        const value = onValueChange.mock.calls[0][0] as Date;
        expect(value.getFullYear()).toBe(2025);
        expect(value.getMonth()).toBe(5);
        expect(value.getDate()).toBe(10);
    });

    it('um preset preenche o intervalo e o Aplicar emite o intervalo dele', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(<DsDatepicker mode="range" onValueChange={onValueChange} />);
        await user.click(trigger());
        await panel();

        await user.click(
            screen.getByRole('button', { name: 'Últimos 7 dias' }),
        );

        expect(screen.getByText('Período selecionado')).toBeInTheDocument();
        expect(trigger()).toHaveTextContent('19 Jun 2025 — 25 Jun 2025');
        expect(day(19)).toHaveAttribute('data-range-start');
        expect(day(25)).toHaveAttribute('data-range-end');
        expect(day(22)).toHaveAttribute('data-in-range');

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        const range = onValueChange.mock.calls[0][0] as DateRange;
        expect(range.start).toEqual(new Date(2025, 5, 19));
        expect(range.end).toEqual(new Date(2025, 5, 25));
    });

    it('presets próprios substituem os padrão', async () => {
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                presets={[
                    {
                        key: 'q1',
                        label: '1º trimestre',
                        range: () => ({
                            start: new Date(2025, 0, 1),
                            end: new Date(2025, 2, 31),
                        }),
                    },
                ]}
            />,
        );
        await user.click(trigger());
        await panel();

        expect(
            screen.queryByRole('button', { name: 'Hoje' }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: '1º trimestre' }));
        expect(trigger()).toHaveTextContent('01 Jan 2025 — 31 Mar 2025');
    });

    it('teclado: abre com Enter, setas mudam o dia, Enter escolhe e o foco volta ao gatilho', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="single"
                value={ANCHOR}
                onValueChange={onValueChange}
            />,
        );

        await user.tab();
        expect(trigger()).toHaveFocus();
        await user.keyboard('{Enter}');
        await panel();

        // Abre com o foco no dia escolhido
        await waitFor(() => expect(day(15)).toHaveFocus());
        await user.keyboard('{ArrowRight}');
        expect(day(16)).toHaveFocus();
        await user.keyboard('{ArrowDown}');
        expect(day(23)).toHaveFocus();
        await user.keyboard('{Enter}');

        const value = onValueChange.mock.calls[0][0] as Date;
        expect(value.getDate()).toBe(23);
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveFocus();
    });

    it('teclado: Esc fecha, descarta a seleção e devolve o foco ao gatilho', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: null }}
                onValueChange={onValueChange}
            />,
        );

        await user.tab();
        await user.keyboard(' ');
        await panel();
        await waitFor(() => expect(day(15)).toHaveFocus());

        await user.keyboard('{ArrowLeft}{Enter}');
        expect(trigger()).toHaveTextContent('14 Jun 2025 — ...');

        await user.keyboard('{Escape}');
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveFocus();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(trigger()).toHaveTextContent('15 Jun 2025 — ...');
    });

    it('disabled: o gatilho fica desabilitado e não abre', async () => {
        const user = setup();
        render(<DsDatepicker disabled />);

        expect(trigger()).toBeDisabled();
        await user.click(trigger());
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('trocar o value de Date para intervalo (e o mode junto) não quebra', () => {
        const { rerender } = render(
            <DsDatepicker mode="single" value={ANCHOR} />,
        );

        rerender(
            <DsDatepicker
                mode="range"
                value={{ start: ANCHOR, end: new Date(2025, 5, 20) }}
            />,
        );
        expect(trigger()).toHaveTextContent('15 Jun 2025');

        rerender(<DsDatepicker mode="single" value={ANCHOR} />);
        expect(trigger()).toHaveTextContent('15 Jun 2025');
    });

    it('controlado: o campo segue o valor do pai; sem value guarda a escolha sozinho', async () => {
        const user = setup();
        const { rerender } = render(
            <DsDatepicker mode="single" value={ANCHOR} />,
        );
        expect(trigger()).toHaveTextContent('15 Jun 2025');

        rerender(<DsDatepicker mode="single" value={new Date(2025, 6, 2)} />);
        expect(trigger()).toHaveTextContent('02 Jul 2025');

        rerender(<DsDatepicker key="solto" mode="single" />);
        await user.click(trigger());
        await panel();
        await user.click(day(3));
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveTextContent('03 Jun 2025');
    });

    it('range controlado: depois do Aplicar o campo mostra o intervalo aplicado', async () => {
        const user = setup();
        render(<Controlled mode="range" />);
        await user.click(trigger());
        await panel();

        await user.click(day(2));
        await user.click(day(5));
        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveTextContent('02 Jun 2025 — 05 Jun 2025');
    });

    it('trigger customizado recebe o rótulo e o estado aberto', async () => {
        const user = setup();
        render(
            <DsDatepicker
                mode="single"
                value={ANCHOR}
                trigger={({ label, open }) => (
                    <span>{`${label} (${open ? 'aberto' : 'fechado'})`}</span>
                )}
            />,
        );
        expect(trigger()).toHaveTextContent('15 Jun 2025 (fechado)');
        await user.click(trigger());
        await panel();
        expect(trigger()).toHaveTextContent('15 Jun 2025 (aberto)');
    });
    // ── Regressões da revisão adversária (rodada 1) ──

    it('data inválida no value vira campo vazio, sem loop de render', () => {
        const { unmount } = render(
            <DsDatepicker mode="single" value={new Date('')} />,
        );
        expect(trigger()).toHaveTextContent('Selecionar período');
        unmount();

        render(
            <DsDatepicker
                mode="range"
                value={{ start: new Date(''), end: new Date('x') }}
            />,
        );
        expect(trigger()).toHaveTextContent('Selecionar período');
    });

    it('atalhos respeitam o maxDate: o que fica todo depois dele é desabilitado, o resto é cortado', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        // maxDate 10 dias antes de "hoje" (25/06)
        const max = new Date(2025, 5, 15);
        render(
            <DsDatepicker
                mode="range"
                maxDate={max}
                onValueChange={onValueChange}
            />,
        );
        await user.click(trigger());
        await panel();

        expect(screen.getByRole('button', { name: 'Hoje' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Ontem' })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Últimos 7 dias' }),
        ).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Hoje' }));
        expect(trigger()).toHaveTextContent('Selecionar período');

        await user.click(screen.getByRole('button', { name: 'Este mês' }));
        expect(trigger()).toHaveTextContent('01 Jun 2025 — 15 Jun 2025');

        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        const range = onValueChange.mock.calls[0][0] as DateRange;
        expect(range.start).toEqual(new Date(2025, 5, 1));
        expect(range.end).toEqual(max);
    });

    it('atalhos respeitam o minDate: o que fica todo antes dele é desabilitado, o resto é cortado', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                minDate={new Date(2025, 5, 10)}
                onValueChange={onValueChange}
                presets={[
                    {
                        key: 'q1',
                        label: '1º trimestre',
                        range: () => ({
                            start: new Date(2025, 0, 1),
                            end: new Date(2025, 2, 31),
                        }),
                    },
                    {
                        key: 'all',
                        label: 'Desde 2020',
                        range: () => ({
                            start: new Date(2020, 0, 1),
                            end: new Date(2025, 5, 25),
                        }),
                    },
                ]}
            />,
        );
        await user.click(trigger());
        await panel();

        expect(
            screen.getByRole('button', { name: '1º trimestre' }),
        ).toBeDisabled();

        await user.click(screen.getByRole('button', { name: 'Desde 2020' }));
        await user.click(screen.getByRole('button', { name: 'Aplicar' }));
        const range = onValueChange.mock.calls[0][0] as DateRange;
        expect(range.start).toEqual(new Date(2025, 5, 10));
        expect(range.end).toEqual(new Date(2025, 5, 25));
    });

    it('um atalho leva o calendário ao mês do início do intervalo', async () => {
        const user = setup();
        render(
            <DsDatepicker
                mode="range"
                presets={[
                    {
                        key: 'q1',
                        label: '1º trimestre',
                        range: () => ({
                            start: new Date(2025, 0, 1),
                            end: new Date(2025, 2, 31),
                        }),
                    },
                ]}
            />,
        );
        await user.click(trigger());
        await panel();
        expect(titles()).toEqual(['Junho 2025', 'Julho 2025']);

        await user.click(screen.getByRole('button', { name: '1º trimestre' }));
        expect(titles()).toEqual(['Janeiro 2025', 'Fevereiro 2025']);
    });

    it('o "Próximo mês" para no mês do maxDate', async () => {
        const user = setup();
        render(<DsDatepicker mode="single" maxDate={new Date(2025, 6, 10)} />);
        await user.click(trigger());
        await panel();
        expect(titles()).toEqual(['Junho 2025']);

        await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
        expect(titles()).toEqual(['Julho 2025']);
        expect(
            screen.getByRole('button', { name: 'Próximo mês' }),
        ).toBeDisabled();
    });

    it('disabled com o painel aberto fecha e descarta o rascunho; reabilitar não reabre', async () => {
        const onValueChange = vi.fn();
        const user = setup();
        const { rerender } = render(
            <DsDatepicker mode="range" onValueChange={onValueChange} />,
        );
        await user.click(trigger());
        await panel();
        await user.click(day(2));
        expect(trigger()).toHaveTextContent('02 Jun 2025 — ...');

        rerender(
            <DsDatepicker
                mode="range"
                disabled
                onValueChange={onValueChange}
            />,
        );
        await waitFor(() =>
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
        );
        expect(trigger()).toHaveTextContent('Selecionar período');

        rerender(<DsDatepicker mode="range" onValueChange={onValueChange} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');
        expect(trigger()).toHaveTextContent('Selecionar período');
        expect(onValueChange).not.toHaveBeenCalled();
    });
});
