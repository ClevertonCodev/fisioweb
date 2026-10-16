import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DsCheckbox } from '@/components/ds';

describe('DsCheckbox', () => {
    it('renderiza um checkbox com o label como nome acessível', () => {
        render(<DsCheckbox label="Aceito os termos" />);

        expect(
            screen.getByRole('checkbox', { name: 'Aceito os termos' }),
        ).toBeInTheDocument();
    });

    it('renderiza título e descrição quando description é informada', () => {
        render(
            <DsCheckbox label="Newsletter" description="Receba novidades" />,
        );

        const checkbox = screen.getByRole('checkbox', { name: /Newsletter/ });
        expect(checkbox).toHaveAccessibleDescription('Receba novidades');
    });

    it('renderiza os filhos quando não há label', () => {
        render(
            <DsCheckbox>
                <span>
                    Li a <a href="#termos">política</a>
                </span>
            </DsCheckbox>,
        );

        expect(
            screen.getByRole('link', { name: 'política' }),
        ).toBeInTheDocument();
    });

    it('reflete marcado e desmarcado a partir de checked boolean', () => {
        render(
            <>
                <DsCheckbox label="A" checked />
                <DsCheckbox label="B" checked={false} />
            </>,
        );

        expect(screen.getByRole('checkbox', { name: 'A' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'B' })).not.toBeChecked();
    });

    it('chama onCheckedChange com o boolean ao alternar (false → true → false)', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsCheckbox
                    label="A"
                    checked={false}
                    onCheckedChange={onCheckedChange}
                />
                <DsCheckbox
                    label="B"
                    checked
                    onCheckedChange={onCheckedChange}
                />
            </>,
        );

        await user.click(screen.getByRole('checkbox', { name: 'A' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(true);

        await user.click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(false);
    });

    it('modo grupo (array): adiciona e remove o value', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsCheckbox
                    label="B"
                    value="b"
                    checked={['a']}
                    onCheckedChange={onCheckedChange}
                />
                <DsCheckbox
                    label="A"
                    value="a"
                    checked={['a', 'b']}
                    onCheckedChange={onCheckedChange}
                />
            </>,
        );

        await user.click(screen.getByRole('checkbox', { name: 'B' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(['a', 'b']);

        await user.click(screen.getByRole('checkbox', { name: 'A' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(['b']);
    });

    it('modo grupo: marcado quando o array inclui o value', () => {
        render(<DsCheckbox label="A" value="a" checked={['a', 'c']} />);

        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('clicar no texto do label alterna', async () => {
        const user = userEvent.setup();

        function Controlled() {
            const [checked, setChecked] = useState(false);
            return (
                <DsCheckbox
                    label="Lembrar"
                    checked={checked}
                    onCheckedChange={(v) => setChecked(v as boolean)}
                />
            );
        }
        render(<Controlled />);

        await user.click(screen.getByText('Lembrar'));

        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('Espaço marca e desmarca pelo teclado', async () => {
        const user = userEvent.setup();
        render(<DsCheckbox label="Teclado" />);

        await user.tab();
        await user.keyboard(' ');
        expect(screen.getByRole('checkbox')).toBeChecked();

        await user.keyboard(' ');
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('indeterminate expõe aria-checked="mixed"', () => {
        render(<DsCheckbox label="Todos" indeterminate />);

        expect(screen.getByRole('checkbox')).toHaveAttribute(
            'aria-checked',
            'mixed',
        );
    });

    it('disabled não chama onCheckedChange e marca o rótulo', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsCheckbox
                label="Bloqueado"
                disabled
                onCheckedChange={onCheckedChange}
            />,
        );

        const checkbox = screen.getByRole('checkbox');
        await user.click(checkbox);

        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(checkbox).toBeDisabled();
        expect(checkbox.closest('label')).toHaveAttribute(
            'aria-disabled',
            'true',
        );
    });

    it('repassa name para o valor do formulário', () => {
        const { container } = render(
            <form>
                <DsCheckbox label="Termos" name="termos" checked />
            </form>,
        );

        expect(
            container.querySelector('input[name="termos"]'),
        ).toBeInTheDocument();
    });

    it('repassa onBlur ao sair com Tab (React Hook Form)', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsCheckbox label="Aceito os termos" onBlur={onBlur} />
                <input aria-label="Próximo" />
            </>,
        );

        screen.getByRole('checkbox', { name: 'Aceito os termos' }).focus();
        await user.tab();

        expect(screen.getByLabelText('Próximo')).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});
