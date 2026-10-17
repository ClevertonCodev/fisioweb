import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import {
    DsCnhField,
    DsCnpjField,
    DsCpfField,
    DsPassportField,
    DsRgField,
} from '@/components/ds';

describe('campos de documento', () => {
    it.each([
        [DsCpfField, '000.000.000-00', 'numeric'],
        [DsCnpjField, '00.000.000/0000-00', 'text'],
        [DsRgField, '00.000.000-0', 'text'],
        [DsCnhField, '00000000000', 'numeric'],
        [DsPassportField, 'AB123456', 'text'],
    ])(
        '%o usa o placeholder e o inputmode do Vue',
        (Field, placeholder, mode) => {
            render(<Field label="Documento" />);

            const input = screen.getByLabelText('Documento');
            expect(input).toHaveAttribute('placeholder', placeholder);
            expect(input).toHaveAttribute('inputmode', mode);
            expect(input).toHaveAttribute('autocomplete', 'off');
        },
    );

    it.each([
        [DsCpfField, '12345678909', '123.456.789-09'],
        [DsCnpjField, '12abc34501de35', '12.ABC.345/01DE-35'],
        [DsRgField, 'mg12.345.678-x', 'MG12.345.678-X'],
        [DsCnhField, '1234567890199', '12345678901'],
        [DsPassportField, 'ab123456', 'AB123456'],
    ])(
        '%o aplica a máscara ao digitar e emite o valor mascarado',
        async (Field, typed, expected) => {
            const onValueChange = vi.fn();
            const user = userEvent.setup();
            render(<Field label="Documento" onValueChange={onValueChange} />);

            await user.type(screen.getByLabelText('Documento'), typed);

            expect(screen.getByLabelText('Documento')).toHaveValue(expected);
            expect(onValueChange).toHaveBeenLastCalledWith(expected);
        },
    );

    it('aplica a máscara ao colar', async () => {
        const user = userEvent.setup();
        render(<DsCpfField label="CPF" />);

        await user.click(screen.getByLabelText('CPF'));
        await user.paste('123.456.789-09');

        expect(screen.getByLabelText('CPF')).toHaveValue('123.456.789-09');
    });

    it('mantém o cursor no lugar ao apagar no meio do valor', () => {
        function Controlled() {
            const [value, setValue] = useState('123.456.789-09');
            return (
                <DsCpfField
                    label="CPF"
                    value={value}
                    onValueChange={setValue}
                />
            );
        }
        render(<Controlled />);
        const input = screen.getByLabelText('CPF') as HTMLInputElement;

        // Apaga o "4" (o cursor estava depois dele, na posição 5).
        input.setSelectionRange(4, 4);
        fireEvent.change(input, {
            target: {
                value: '123.56.789-09',
                selectionStart: 4,
                selectionEnd: 4,
            },
        });

        expect(input).toHaveValue('123.567.890-9');
        expect(input.selectionStart).toBe(4);
    });

    it('mostra o asterisco de obrigatório e marca required', () => {
        render(<DsCpfField label="CPF" required />);

        const input = screen.getByLabelText(/CPF/);
        expect(input).toBeRequired();
        expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    });

    it('mostra o helper só quando invalid, ligado ao input', () => {
        const { rerender } = render(
            <DsCpfField label="CPF" helperText="CPF inválido" />,
        );
        expect(screen.queryByText('CPF inválido')).not.toBeInTheDocument();
        expect(screen.getByLabelText('CPF')).toHaveAttribute(
            'aria-invalid',
            'false',
        );

        rerender(<DsCpfField label="CPF" helperText="CPF inválido" invalid />);
        const input = screen.getByLabelText('CPF');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAccessibleDescription('CPF inválido');
    });

    it('disabled desabilita o input', () => {
        render(<DsRgField label="RG" disabled />);

        expect(screen.getByLabelText('RG')).toBeDisabled();
    });

    it('sem label fica no modo compacto', () => {
        render(<DsCnhField aria-label="CNH" />);

        expect(
            screen.getByLabelText('CNH').closest('[data-compact]'),
        ).not.toBeNull();
    });

    it('chama onBlur', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(<DsPassportField label="Passaporte" onBlur={onBlur} />);

        await user.click(screen.getByLabelText('Passaporte'));
        await user.tab();

        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('funciona com register do React Hook Form', async () => {
        const onSubmit = vi.fn();

        function Form() {
            const { register, handleSubmit } = useForm<{ cpf: string }>({
                defaultValues: { cpf: '' },
            });
            return (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DsCpfField label="CPF" {...register('cpf')} />
                    <button type="submit">Enviar</button>
                </form>
            );
        }
        const user = userEvent.setup();
        render(<Form />);

        await user.type(screen.getByLabelText('CPF'), '12345678909');
        await user.click(screen.getByRole('button', { name: 'Enviar' }));

        expect(onSubmit).toHaveBeenCalledWith(
            { cpf: '123.456.789-09' },
            expect.anything(),
        );
    });
});
