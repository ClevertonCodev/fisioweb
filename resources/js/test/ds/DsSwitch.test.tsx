import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DsSwitch } from '@/components/ds';

describe('DsSwitch', () => {
    it('renderiza com role="switch" desligado por padrão', () => {
        render(<DsSwitch label="Ativar" />);

        const sw = screen.getByRole('switch', { name: 'Ativar' });
        expect(sw).toHaveAttribute('aria-checked', 'false');
    });

    it('reflete checked=true', () => {
        render(<DsSwitch label="Ativar" checked />);

        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'true',
        );
    });

    it('chama onCheckedChange com o boolean negado (false → true e true → false)', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsSwitch
                    label="A"
                    checked={false}
                    onCheckedChange={onCheckedChange}
                />
                <DsSwitch label="B" checked onCheckedChange={onCheckedChange} />
            </>,
        );

        await user.click(screen.getByRole('switch', { name: 'A' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(true);

        await user.click(screen.getByRole('switch', { name: 'B' }));
        expect(onCheckedChange).toHaveBeenLastCalledWith(false);
        expect(onCheckedChange).toHaveBeenCalledTimes(2);
    });

    it('Espaço alterna pelo teclado e clicar no label também', async () => {
        const user = userEvent.setup();

        function Controlled() {
            const [on, setOn] = useState(false);
            return (
                <DsSwitch
                    label="Lembrete"
                    checked={on}
                    onCheckedChange={setOn}
                />
            );
        }
        render(<Controlled />);

        await user.tab();
        await user.keyboard(' ');
        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'true',
        );

        await user.click(screen.getByText('Lembrete'));
        expect(screen.getByRole('switch')).toHaveAttribute(
            'aria-checked',
            'false',
        );
    });

    it('disabled não alterna e marca o rótulo', async () => {
        const onCheckedChange = vi.fn();
        const user = userEvent.setup();
        render(
            <DsSwitch
                label="Bloqueado"
                disabled
                onCheckedChange={onCheckedChange}
            />,
        );

        const sw = screen.getByRole('switch');
        await user.click(sw);

        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(sw).toBeDisabled();
        expect(sw.closest('label')).toHaveAttribute('aria-disabled', 'true');
    });

    it('renderiza label e description', () => {
        render(<DsSwitch label="Ativar" description="Liga o recurso" />);

        expect(
            screen.getByRole('switch', { name: /Ativar/ }),
        ).toHaveAccessibleDescription('Liga o recurso');
    });

    it('renderiza os filhos quando não há label nem description', () => {
        render(
            <DsSwitch>
                <span className="slotado">Conteúdo</span>
            </DsSwitch>,
        );

        expect(screen.getByText('Conteúdo')).toBeInTheDocument();
    });

    it('repassa o name para o formulário', () => {
        const { container } = render(
            <form>
                <DsSwitch label="Ativo" name="ativo" checked />
            </form>,
        );

        expect(
            container.querySelector('input[name="ativo"]'),
        ).toBeInTheDocument();
    });

    it('repassa onBlur ao sair com Tab (React Hook Form)', async () => {
        const onBlur = vi.fn();
        const user = userEvent.setup();
        render(
            <>
                <DsSwitch label="Ativar" onBlur={onBlur} />
                <input aria-label="Próximo" />
            </>,
        );

        screen.getByRole('switch', { name: 'Ativar' }).focus();
        await user.tab();

        expect(screen.getByLabelText('Próximo')).toHaveFocus();
        expect(onBlur).toHaveBeenCalledTimes(1);
    });
});
