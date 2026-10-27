import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { DsTimepickerProps } from '@/components/ds/timepicker/DsTimepicker';
import { DsTimepicker } from '@/components/ds/timepicker/DsTimepicker';
import {
    formatTypedTime,
    parseTime,
} from '@/components/ds/timepicker/time-format';

describe('formatTypedTime', () => {
    // Mesma regra do Vue: só dígitos, no máximo 4, e ":" depois dos dois
    // primeiros. Não completa zero à esquerda nem confere a faixa.
    it.each([
        ['', ''],
        ['9', '9'],
        ['09', '09'],
        ['093', '09:3'],
        ['0930', '09:30'],
        ['09:30', '09:30'],
        ['930', '93:0'],
        ['2359', '23:59'],
        ['0000', '00:00'],
        ['12345', '12:34'],
        ['ab1c2', '12'],
        ['ab', ''],
        ['9h30', '93:0'],
        ['99:99', '99:99'],
    ])('"%s" vira "%s"', (typed, expected) => {
        expect(formatTypedTime(typed)).toBe(expected);
    });
});

describe('parseTime', () => {
    it.each([
        ['00:00', { hour: '00', minute: '00' }],
        ['09:30', { hour: '09', minute: '30' }],
        ['23:59', { hour: '23', minute: '59' }],
        ['24:00', null],
        ['12:60', null],
        ['9:30', null],
        ['09:3', null],
        ['', null],
        ['abc', null],
    ])('"%s" vira %j', (value, expected) => {
        expect(parseTime(value)).toEqual(expected);
    });
});

function Controlled({
    initial = '',
    onValueChange,
    ...rest
}: Omit<DsTimepickerProps, 'value'> & { initial?: string }) {
    const [value, setValue] = useState(initial);
    return (
        <DsTimepicker
            {...rest}
            value={value}
            onValueChange={(next) => {
                setValue(next);
                onValueChange?.(next);
            }}
        />
    );
}

describe('DsTimepicker', () => {
    it('renderiza com os defaults do Vue', () => {
        render(<DsTimepicker />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        expect(input).toHaveValue('');
        expect(input).toHaveAttribute('placeholder', 'HH:MM');
        expect(input).toHaveAttribute('inputmode', 'numeric');
        expect(input).toHaveAttribute('maxlength', '5');
        expect(input).toHaveAttribute('autocomplete', 'off');
        expect(input).toHaveAttribute('aria-haspopup', 'listbox');
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(
            screen.getByRole('button', { name: 'Escolher horário na lista' }),
        ).toHaveAttribute('tabindex', '-1');
        expect(screen.getByTestId('ds-timepicker-icon')).toBeInTheDocument();
    });

    it('aceita id, ariaLabel e placeholder', () => {
        render(
            <DsTimepicker
                id="inicio"
                ariaLabel="Início da sessão"
                placeholder="00:00"
            />,
        );

        const input = screen.getByRole('combobox', {
            name: 'Início da sessão',
        });
        expect(input).toHaveAttribute('id', 'inicio');
        expect(input).toHaveAttribute('placeholder', '00:00');
    });

    it('com prefix mostra o texto no lugar do ícone', () => {
        render(<DsTimepicker prefix="Das" />);

        expect(screen.getByText('Das')).toBeInTheDocument();
        expect(
            screen.queryByTestId('ds-timepicker-icon'),
        ).not.toBeInTheDocument();
    });

    it('formata enquanto digita e avisa onValueChange', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled onValueChange={onValueChange} />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.type(input, '0930');

        expect(input).toHaveValue('09:30');
        expect(onValueChange).toHaveBeenLastCalledWith('09:30');
    });

    it('sem value do pai, guarda o texto sozinho', async () => {
        const user = userEvent.setup();
        render(<DsTimepicker />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.type(input, '1415');

        expect(input).toHaveValue('14:15');
    });

    it('onChange dispara ao confirmar o texto (sair do campo)', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled onChange={onChange} />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.type(input, '0745');
        expect(onChange).not.toHaveBeenCalled();

        await user.tab();

        expect(onChange).toHaveBeenCalledWith('07:45');
    });

    it('abre a lista ao clicar no campo, com o horário atual marcado', async () => {
        const user = userEvent.setup();
        render(<Controlled initial="09:30" />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.click(input);

        expect(input).toHaveAttribute('aria-expanded', 'true');
        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        const minutes = screen.getByRole('listbox', { name: 'Minuto' });
        expect(within(hours).getAllByRole('option')).toHaveLength(24);
        expect(within(minutes).getAllByRole('option')).toHaveLength(60);
        expect(
            within(hours).getByRole('option', { selected: true }),
        ).toHaveTextContent('09');
        expect(
            within(minutes).getByRole('option', { selected: true }),
        ).toHaveTextContent('30');
        // Clicar no campo não tira o foco dele: dá para seguir digitando.
        expect(input).toHaveFocus();
    });

    it('valor inválido abre a lista em 00:00', async () => {
        const user = userEvent.setup();
        render(<Controlled initial="99:99" />);

        await user.click(screen.getByRole('combobox', { name: 'Horário' }));

        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        const minutes = screen.getByRole('listbox', { name: 'Minuto' });
        expect(
            within(hours).getByRole('option', { selected: true }),
        ).toHaveTextContent('00');
        expect(
            within(minutes).getByRole('option', { selected: true }),
        ).toHaveTextContent('00');
    });

    it('escolher hora e minuto na lista avisa onValueChange e onChange e fecha', async () => {
        const onValueChange = vi.fn();
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(
            <Controlled onValueChange={onValueChange} onChange={onChange} />,
        );

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.click(input);
        const hours = await screen.findByRole('listbox', { name: 'Hora' });

        // Escolher a hora só marca; o valor sai ao escolher o minuto.
        await user.click(within(hours).getByRole('option', { name: '14' }));
        expect(onValueChange).not.toHaveBeenCalled();
        expect(
            within(hours).getByRole('option', { selected: true }),
        ).toHaveTextContent('14');

        const minutes = screen.getByRole('listbox', { name: 'Minuto' });
        await user.click(within(minutes).getByRole('option', { name: '45' }));

        expect(onValueChange).toHaveBeenCalledWith('14:45');
        expect(onChange).toHaveBeenCalledWith('14:45');
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(input).toHaveValue('14:45');
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('digitar um horário válido com a lista aberta move a marcação', async () => {
        const user = userEvent.setup();
        render(<Controlled />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        await user.click(input);
        await user.type(input, '1620');

        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        const minutes = screen.getByRole('listbox', { name: 'Minuto' });
        expect(
            within(hours).getByRole('option', { selected: true }),
        ).toHaveTextContent('16');
        expect(
            within(minutes).getByRole('option', { selected: true }),
        ).toHaveTextContent('20');
    });

    it('o botão de seta abre e fecha a lista', async () => {
        const user = userEvent.setup();
        render(<DsTimepicker />);

        const toggle = screen.getByRole('button', {
            name: 'Escolher horário na lista',
        });
        await user.click(toggle);
        expect(
            await screen.findByRole('listbox', { name: 'Hora' }),
        ).toBeInTheDocument();

        await user.click(toggle);
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
    });

    it('fecha ao clicar fora', async () => {
        const user = userEvent.setup();
        render(
            <>
                <DsTimepicker />
                <button type="button">fora</button>
            </>,
        );

        await user.click(screen.getByRole('combobox', { name: 'Horário' }));
        await screen.findByRole('listbox', { name: 'Hora' });

        await user.click(screen.getByRole('button', { name: 'fora' }));
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
    });

    it('teclado: seta abre a lista, setas andam, Enter escolhe hora e minuto', async () => {
        const onChange = vi.fn();
        const user = userEvent.setup();
        render(<Controlled initial="08:00" onChange={onChange} />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        input.focus();
        await user.keyboard('{ArrowDown}');

        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        await waitFor(() => expect(hours).toHaveFocus());
        // Começa na hora atual.
        expect(hours).toHaveAttribute(
            'aria-activedescendant',
            within(hours).getByRole('option', { name: '08' }).id,
        );

        await user.keyboard('{ArrowDown}{ArrowDown}{ArrowUp}');
        expect(hours).toHaveAttribute(
            'aria-activedescendant',
            within(hours).getByRole('option', { name: '09' }).id,
        );

        // Enter na hora marca e passa para os minutos.
        await user.keyboard('{Enter}');
        const minutes = screen.getByRole('listbox', { name: 'Minuto' });
        expect(minutes).toHaveFocus();
        expect(
            within(hours).getByRole('option', { selected: true }),
        ).toHaveTextContent('09');

        await user.keyboard('{End}');
        expect(minutes).toHaveAttribute(
            'aria-activedescendant',
            within(minutes).getByRole('option', { name: '59' }).id,
        );
        await user.keyboard('{Home}{ArrowDown}{Enter}');

        expect(onChange).toHaveBeenCalledWith('09:01');
        expect(input).toHaveValue('09:01');
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(input).toHaveFocus();
    });

    it('teclado: setas laterais trocam de coluna', async () => {
        const user = userEvent.setup();
        render(<DsTimepicker />);

        screen.getByRole('combobox', { name: 'Horário' }).focus();
        await user.keyboard('{ArrowDown}');
        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        await waitFor(() => expect(hours).toHaveFocus());

        await user.keyboard('{ArrowRight}');
        expect(screen.getByRole('listbox', { name: 'Minuto' })).toHaveFocus();

        await user.keyboard('{ArrowLeft}');
        expect(hours).toHaveFocus();
    });

    it('teclado: Esc fecha a lista e devolve o foco ao campo', async () => {
        const user = userEvent.setup();
        render(<DsTimepicker />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        input.focus();
        await user.keyboard('{ArrowDown}');
        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        await waitFor(() => expect(hours).toHaveFocus());

        await user.keyboard('{Escape}');

        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(input).toHaveFocus();
        expect(input).toHaveAttribute('aria-expanded', 'false');
    });

    it('teclado: Tab dentro da lista fecha e volta ao campo', async () => {
        const user = userEvent.setup();
        render(<DsTimepicker />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        input.focus();
        await user.keyboard('{ArrowDown}');
        const hours = await screen.findByRole('listbox', { name: 'Hora' });
        await waitFor(() => expect(hours).toHaveFocus());

        await user.tab();

        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
        expect(input).toHaveFocus();
    });

    it('teclado: Tab saindo do campo fecha a lista', async () => {
        const user = userEvent.setup();
        render(
            <>
                <DsTimepicker />
                <button type="button">próximo</button>
            </>,
        );

        await user.click(screen.getByRole('combobox', { name: 'Horário' }));
        await screen.findByRole('listbox', { name: 'Hora' });

        await user.tab();

        expect(screen.getByRole('button', { name: 'próximo' })).toHaveFocus();
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );
    });

    it('disabled: não digita nem abre a lista', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsTimepicker disabled onValueChange={onValueChange} />);

        const input = screen.getByRole('combobox', { name: 'Horário' });
        const toggle = screen.getByRole('button', {
            name: 'Escolher horário na lista',
        });
        expect(input).toBeDisabled();
        expect(toggle).toBeDisabled();

        await user.click(input);
        await user.click(toggle);
        await user.type(input, '1200');

        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(onValueChange).not.toHaveBeenCalled();
    });

    it('repassa a ref para o input', () => {
        let element: HTMLInputElement | null = null;
        render(
            <DsTimepicker
                ref={(node) => {
                    element = node;
                }}
            />,
        );

        expect(element).toBe(screen.getByRole('combobox', { name: 'Horário' }));
    });
    it('disabled com a lista aberta fecha; reabilitar não reabre sozinho', async () => {
        const user = userEvent.setup();
        const { rerender } = render(<DsTimepicker />);
        await user.click(screen.getByRole('combobox', { name: 'Horário' }));
        expect(await screen.findAllByRole('listbox')).toHaveLength(2);

        rerender(<DsTimepicker disabled />);
        await waitFor(() =>
            expect(screen.queryByRole('listbox')).not.toBeInTheDocument(),
        );

        rerender(<DsTimepicker />);
        expect(
            screen.getByRole('combobox', { name: 'Horário' }),
        ).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
});
