import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { SelectOption } from '@/components/ds';
import { DsSelect } from '@/components/ds';

const options: SelectOption[] = [
    { value: 'sp', label: 'São Paulo' },
    { value: 'rj', label: 'Rio de Janeiro' },
    { value: 'mg', label: 'Minas Gerais', disabled: true },
];

describe('DsSelect', () => {
    it('renderiza o placeholder como option desabilitada quando vazio', () => {
        render(
            <DsSelect options={options} placeholder="Selecione um estado" />,
        );

        const select = screen.getByRole('combobox');
        const placeholder = within(select).getByRole('option', {
            name: 'Selecione um estado',
        });
        expect(placeholder).toBeDisabled();
        expect(select).toHaveValue('');
    });

    it('usa "Selecione..." como placeholder padrão', () => {
        render(<DsSelect options={options} />);

        expect(
            screen.getByRole('option', { name: 'Selecione...' }),
        ).toBeInTheDocument();
    });

    it('renderiza uma option por item com value e label', () => {
        render(<DsSelect options={options} />);

        const opts = screen.getAllByRole('option');
        expect(opts).toHaveLength(4);
        expect(opts[1]).toHaveValue('sp');
        expect(opts[1]).toHaveTextContent('São Paulo');
        expect(opts[2]).toHaveValue('rj');
        expect(opts[3]).toHaveValue('mg');
    });

    it('seleciona a option correspondente ao value', () => {
        render(
            <DsSelect options={options} value="rj" onValueChange={() => {}} />,
        );

        expect(screen.getByRole('combobox')).toHaveValue('rj');
    });

    it('desabilita a option marcada como disabled', () => {
        render(<DsSelect options={options} />);

        expect(
            screen.getByRole('option', { name: 'Minas Gerais' }),
        ).toBeDisabled();
    });

    it('chama onValueChange com o value ao escolher', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(<DsSelect options={options} onValueChange={onValueChange} />);

        await user.selectOptions(screen.getByRole('combobox'), 'sp');

        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith('sp');
    });

    it('aplica disabled ao select nativo', () => {
        render(<DsSelect options={options} disabled />);

        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('associa o label ao select, com o id gerado ou o fornecido', () => {
        render(
            <>
                <DsSelect options={options} label="Estado" />
                <DsSelect options={options} label="UF" id="estado-field" />
            </>,
        );

        expect(screen.getByLabelText('Estado')).toBeInTheDocument();
        expect(screen.getByLabelText('UF')).toHaveAttribute(
            'id',
            'estado-field',
        );
    });

    it('renderiza o helper descrevendo o select', () => {
        render(
            <DsSelect
                options={options}
                label="Estado"
                helper="Escolha seu estado"
            />,
        );

        expect(screen.getByLabelText('Estado')).toHaveAccessibleDescription(
            'Escolha seu estado',
        );
    });

    it('marca os estados de erro e sucesso', () => {
        render(
            <>
                <DsSelect options={options} label="Erro" state="error" />
                <DsSelect options={options} label="Ok" state="success" />
                <DsSelect options={options} label="Padrão" />
            </>,
        );

        const erro = screen.getByLabelText('Erro');
        expect(erro).toHaveAttribute('aria-invalid', 'true');
        expect(erro.closest('[data-state]')).toHaveAttribute(
            'data-state',
            'error',
        );
        expect(
            screen.getByLabelText('Ok').closest('[data-state]'),
        ).toHaveAttribute('data-state', 'success');
        expect(
            screen.getByLabelText('Padrão').closest('[data-state]'),
        ).toHaveAttribute('data-state', 'default');
    });

    it('aplica o tamanho sm', () => {
        render(<DsSelect options={options} size="sm" />);

        expect(screen.getByRole('combobox')).toHaveAttribute('data-size', 'sm');
    });

    it('repassa name e atributos extras ao select', () => {
        render(
            <DsSelect
                options={options}
                name="estado"
                data-testid="estado-select"
                aria-label="Estado"
            />,
        );

        const select = screen.getByTestId('estado-select');
        expect(select.tagName).toBe('SELECT');
        expect(select).toHaveAttribute('name', 'estado');
        expect(select).toHaveAttribute('aria-label', 'Estado');
    });

    it('chama onBlur ao desfocar', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(<DsSelect options={options} onBlur={onBlur} />);

        await user.click(screen.getByRole('combobox'));
        await user.tab();

        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('multiple ativa o atributo e omite o placeholder', () => {
        render(<DsSelect options={options} multiple />);

        const select = screen.getByRole('listbox');
        expect(select).toHaveAttribute('multiple');
        expect(
            screen.queryByRole('option', { name: 'Selecione...' }),
        ).not.toBeInTheDocument();
    });

    it('multiple chama onValueChange com a lista de values', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState<string | string[]>([]);
            return (
                <DsSelect
                    options={options}
                    multiple
                    value={value}
                    onValueChange={(v) => {
                        setValue(v);
                        onValueChange(v);
                    }}
                />
            );
        }
        render(<Controlled />);

        await user.selectOptions(screen.getByRole('listbox'), ['sp', 'rj']);

        expect(onValueChange).toHaveBeenLastCalledWith(['sp', 'rj']);
    });
});
