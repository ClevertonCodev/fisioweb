import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { DsMoneyInput } from '@/components/ds';

describe('DsMoneyInput', () => {
    it('mostra o valor com a máscara em BRL por padrão', () => {
        render(<DsMoneyInput value={1234.56} onValueChange={() => {}} />);

        expect(screen.getByRole('textbox')).toHaveValue('R$ 1.234,56');
    });

    it('mostra o prefixo da moeda escolhida', () => {
        render(
            <DsMoneyInput value={10} currency="EUR" onValueChange={() => {}} />,
        );

        expect(screen.getByRole('textbox')).toHaveValue('€ 10,00');
    });

    it('emite o valor numérico ao digitar', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState<number | null>(0);
            return (
                <DsMoneyInput
                    value={value}
                    onValueChange={(v) => {
                        setValue(v);
                        onValueChange(v);
                    }}
                />
            );
        }
        render(<Controlled />);

        await user.type(screen.getByRole('textbox'), '9990');

        expect(screen.getByRole('textbox')).toHaveValue('R$ 99,90');
        expect(onValueChange).toHaveBeenLastCalledWith(99.9);
    });

    it('com o cursor no começo do campo, os dígitos ainda entram no fim', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState<number | null>(0);
            return (
                <DsMoneyInput
                    value={value}
                    onValueChange={(v) => {
                        setValue(v);
                        onValueChange(v);
                    }}
                />
            );
        }
        render(<Controlled />);

        await user.type(screen.getByRole('textbox'), '15000', {
            initialSelectionStart: 0,
            initialSelectionEnd: 0,
        });

        expect(onValueChange).toHaveBeenLastCalledWith(150);
        expect(screen.getByRole('textbox')).toHaveValue('R$ 150,00');
    });

    it('funciona sem estado no pai (não controlado)', async () => {
        const user = userEvent.setup();
        render(<DsMoneyInput currency="USD" />);

        await user.type(screen.getByRole('textbox'), '150');

        expect(screen.getByRole('textbox')).toHaveValue('$ 1,50');
    });

    it.each([
        ['R$ 0,00', 'R$ 80,00', 0, 80],
        ['R$ 1,00', 'R$ 51,00', 1, 51],
        ['R$ 1,50', 'R$ 21,50', 1.5, 21.5],
    ])(
        'sobre %s, colar %s substitui o valor (só um dígito de diferença)',
        async (_shown, pasted, initial, expected) => {
            const onValueChange = vi.fn();
            const user = userEvent.setup();
            render(
                <DsMoneyInput
                    defaultValue={initial}
                    onValueChange={onValueChange}
                />,
            );

            const input = screen.getByRole('textbox');
            await user.click(input);
            await user.keyboard('{Control>}a{/Control}');
            await user.paste(pasted);

            expect(onValueChange).toHaveBeenLastCalledWith(expected);
            expect(input).toHaveValue(pasted);
        },
    );

    it('respeita maxDigits', async () => {
        const user = userEvent.setup();
        render(<DsMoneyInput maxDigits={4} />);

        await user.type(screen.getByRole('textbox'), '123456');

        expect(screen.getByRole('textbox')).toHaveValue('R$ 99,99');
    });

    it('usa inputmode decimal, label, helper e estado de erro', () => {
        render(
            <DsMoneyInput
                label="Valor da sessão"
                helper="Obrigatório"
                state="error"
            />,
        );

        const input = screen.getByLabelText('Valor da sessão');
        expect(input).toHaveAttribute('inputmode', 'decimal');
        expect(input).toHaveAccessibleDescription('Obrigatório');
        expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('funciona com Controller do React Hook Form', async () => {
        const onSubmit = vi.fn();
        const schema = z.object({
            valor: z.number().positive('Informe o valor'),
        });

        function Form() {
            const { control, handleSubmit } = useForm<{ valor: number }>({
                resolver: zodResolver(schema),
                defaultValues: { valor: 0 },
            });
            return (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                        control={control}
                        name="valor"
                        render={({ field, fieldState }) => (
                            <DsMoneyInput
                                label="Valor"
                                name={field.name}
                                ref={field.ref}
                                value={field.value}
                                onValueChange={(v) => field.onChange(v ?? 0)}
                                onBlur={field.onBlur}
                                state={fieldState.error ? 'error' : 'default'}
                                helper={fieldState.error?.message}
                            />
                        )}
                    />
                    <button type="submit">Enviar</button>
                </form>
            );
        }

        const user = userEvent.setup();
        render(<Form />);

        await user.click(screen.getByRole('button', { name: 'Enviar' }));
        expect(await screen.findByText('Informe o valor')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Valor'), '12000');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(onSubmit).toHaveBeenCalledWith(
            { valor: 120 },
            expect.anything(),
        );
    });
});
