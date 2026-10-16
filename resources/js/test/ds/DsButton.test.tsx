import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import { DsButton } from '@/components/ds';

describe('DsButton', () => {
    it('renderiza o label com a variante e o tamanho padrão', () => {
        render(<DsButton label="Salvar" />);

        const button = screen.getByRole('button', { name: 'Salvar' });
        expect(button).toHaveAttribute('data-variant', 'primary');
        expect(button).toHaveAttribute('data-size', 'md');
    });

    it('usa "Botão" como label padrão', () => {
        render(<DsButton />);

        expect(
            screen.getByRole('button', { name: 'Botão' }),
        ).toBeInTheDocument();
    });

    it('aplica a variante e o tamanho via props', () => {
        render(<DsButton variant="destructive" size="lg" />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-variant', 'destructive');
        expect(button).toHaveAttribute('data-size', 'lg');
    });

    it('size="sm" mantém a altura de linha junto do tamanho de fonte menor', () => {
        render(<DsButton size="sm" />);

        const button = screen.getByRole('button');
        expect(button).toHaveClass('leading-none');
        expect(button).toHaveClass('text-ds-caption');
        expect(button).not.toHaveClass('text-ds-body-xs');
    });

    it('size="full" ocupa a largura toda', () => {
        render(<DsButton size="full" />);

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-size', 'full');
        expect(button).toHaveClass('w-full');
    });

    it('chama onClick ao clicar', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<DsButton onClick={onClick} />);

        await user.click(screen.getByRole('button'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('não chama onClick quando disabled', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<DsButton disabled onClick={onClick} />);

        await user.click(screen.getByRole('button'));

        expect(onClick).not.toHaveBeenCalled();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('não chama onClick quando loading e expõe aria-busy', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(<DsButton loading onClick={onClick} />);

        await user.click(screen.getByRole('button'));

        const button = screen.getByRole('button');
        expect(onClick).not.toHaveBeenCalled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(button).toHaveAttribute('data-loading', 'true');
    });

    it('só ícone usa o label como nome acessível e não mostra o texto', () => {
        render(<DsButton iconPosition="only" label="Fechar" icon={<Star />} />);

        const button = screen.getByRole('button', { name: 'Fechar' });
        expect(button).toHaveAttribute('aria-label', 'Fechar');
        expect(button).toHaveAttribute('data-icon-only', 'true');
        expect(button).not.toHaveTextContent('Fechar');
    });

    it('só ícone mostra o tooltip (texto = label) no hover e some ao sair', async () => {
        const user = userEvent.setup();
        render(
            <DsButton iconPosition="only" label="Atualizar" icon={<Star />} />,
        );

        await user.hover(screen.getByRole('button'));
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Atualizar',
        );

        await user.unhover(screen.getByRole('button'));
        await waitFor(() =>
            expect(screen.queryByRole('tooltip')).not.toBeInTheDocument(),
        );
    });

    it('só ícone mostra o tooltip no foco do teclado, com o texto de tooltip', async () => {
        const user = userEvent.setup();
        render(
            <DsButton
                iconPosition="only"
                label="Atualizar"
                tooltip="Recarregar a lista"
                icon={<Star />}
            />,
        );

        await user.tab();

        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Recarregar a lista',
        );
    });

    it('botão com texto não mostra tooltip', async () => {
        const user = userEvent.setup();
        render(<DsButton label="Salvar" />);

        await user.hover(screen.getByRole('button'));

        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('renderiza o ícone à esquerda do texto', () => {
        render(
            <DsButton
                label="Favoritar"
                iconPosition="left"
                icon={<Star data-testid="icone" />}
            />,
        );

        const button = screen.getByRole('button');
        const icon = screen.getByTestId('icone');
        expect(button.firstElementChild).toBe(icon);
    });

    it('renderiza o ícone à direita do texto', () => {
        render(
            <DsButton
                label="Avançar"
                iconPosition="right"
                icon={<Star data-testid="icone" />}
            />,
        );

        expect(screen.getByRole('button').lastElementChild).toBe(
            screen.getByTestId('icone'),
        );
    });

    it('repassa o type para o elemento button', () => {
        render(<DsButton type="submit" />);

        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });

    it('usa type="button" por padrão', () => {
        render(<DsButton />);

        expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
    });
});
