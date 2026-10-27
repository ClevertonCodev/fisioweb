import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DsRadio, DsRadioGroup } from '@/components/ds';

describe('DsRadio', () => {
    it('renderiza um radio com o label como nome acessível', () => {
        render(
            <DsRadioGroup aria-label="Opções">
                <DsRadio value="a" label="Opção A" />
            </DsRadioGroup>,
        );

        expect(
            screen.getByRole('radio', { name: 'Opção A' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('radiogroup', { name: 'Opções' }),
        ).toBeInTheDocument();
    });

    it('renderiza título e descrição', () => {
        render(
            <DsRadioGroup>
                <DsRadio
                    value="pro"
                    label="Plano Pro"
                    description="Recursos avançados"
                />
            </DsRadioGroup>,
        );

        expect(
            screen.getByRole('radio', { name: /Plano Pro/ }),
        ).toHaveAccessibleDescription('Recursos avançados');
    });

    it('apenas o item com value igual ao do grupo fica marcado', () => {
        render(
            <DsRadioGroup value="b">
                <DsRadio value="a" label="A" />
                <DsRadio value="b" label="B" />
            </DsRadioGroup>,
        );

        expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
        expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
    });

    it('chama onValueChange com o value do item escolhido', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsRadioGroup value="b" onValueChange={onValueChange}>
                <DsRadio value="a" label="A" />
                <DsRadio value="b" label="B" />
            </DsRadioGroup>,
        );

        await user.click(screen.getByRole('radio', { name: 'A' }));

        expect(onValueChange).toHaveBeenCalledTimes(1);
        expect(onValueChange).toHaveBeenCalledWith('a');
    });

    it('suporta value numérico', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsRadioGroup value={1} onValueChange={onValueChange}>
                <DsRadio value={1} label="Um" />
                <DsRadio value={2} label="Dois" />
            </DsRadioGroup>,
        );

        expect(screen.getByRole('radio', { name: 'Um' })).toBeChecked();
        await user.click(screen.getByRole('radio', { name: 'Dois' }));

        expect(onValueChange).toHaveBeenCalledWith(2);
    });

    it('as setas trocam o item selecionado', async () => {
        const user = userEvent.setup();

        function Controlled() {
            const [value, setValue] = useState<string | number>('a');
            return (
                <DsRadioGroup value={value} onValueChange={setValue}>
                    <DsRadio value="a" label="A" />
                    <DsRadio value="b" label="B" />
                    <DsRadio value="c" label="C" />
                </DsRadioGroup>
            );
        }
        render(<Controlled />);

        await user.tab();
        expect(screen.getByRole('radio', { name: 'A' })).toHaveFocus();

        // O Radix só seleciona se a seta ainda estiver pressionada quando o foco
        // chega (o foco vem num setTimeout); por isso a tecla é segurada e solta.
        await user.keyboard('{ArrowDown>}');
        await waitFor(() =>
            expect(screen.getByRole('radio', { name: 'B' })).toBeChecked(),
        );
        await user.keyboard('{/ArrowDown}');

        await user.keyboard('{ArrowDown>}');
        await waitFor(() =>
            expect(screen.getByRole('radio', { name: 'C' })).toBeChecked(),
        );
        await user.keyboard('{/ArrowDown}');
    });

    it('item disabled não é selecionado', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsRadioGroup value="a" onValueChange={onValueChange}>
                <DsRadio value="a" label="A" />
                <DsRadio value="b" label="B" disabled />
            </DsRadioGroup>,
        );

        const b = screen.getByRole('radio', { name: 'B' });
        await user.click(b);

        expect(onValueChange).not.toHaveBeenCalled();
        expect(b).toBeDisabled();
        expect(b.closest('label')).toHaveAttribute('aria-disabled', 'true');
    });

    it('repassa o name do grupo para o formulário', () => {
        const { container } = render(
            <form>
                <DsRadioGroup name="plano" value="a">
                    <DsRadio value="a" label="A" />
                </DsRadioGroup>
            </form>,
        );

        expect(
            container.querySelector('input[name="plano"]'),
        ).toBeInTheDocument();
    });

    it('repassa onBlur só quando o foco sai do grupo (React Hook Form)', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsRadioGroup aria-label="Plano" onBlur={onBlur}>
                    <DsRadio value="basico" label="Básico" />
                    <DsRadio value="pro" label="Pro" />
                </DsRadioGroup>
                <input aria-label="Próximo" />
            </>,
        );

        screen.getByRole('radio', { name: 'Básico' }).focus();
        await user.keyboard('{ArrowDown>}');
        expect(screen.getByRole('radio', { name: 'Pro' })).toHaveFocus();
        expect(onBlur).not.toHaveBeenCalled();

        await user.tab();

        expect(screen.getByLabelText('Próximo')).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('clicar no texto do rótulo seleciona o item', async () => {
        const onValueChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsRadioGroup aria-label="Plano" onValueChange={onValueChange}>
                <DsRadio value="basico" label="Básico" />
                <DsRadio value="pro" label="Pro" />
            </DsRadioGroup>,
        );

        await user.click(screen.getByText('Pro'));

        expect(screen.getByRole('radio', { name: 'Pro' })).toBeChecked();
        expect(onValueChange).toHaveBeenCalledWith('pro');
    });
});
