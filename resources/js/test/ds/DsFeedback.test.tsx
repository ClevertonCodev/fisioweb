import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Star } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { BadgeVariant } from '@/components/ds';
import { DsAlert, DsBadge, DsBanner, DsEmptyState } from '@/components/ds';

describe('DsBadge', () => {
    it.each<BadgeVariant>([
        'default',
        'primary',
        'info',
        'success',
        'warning',
        'danger',
        'new',
    ])('variante %s', (variant) => {
        render(<DsBadge variant={variant}>Status</DsBadge>);

        expect(screen.getByText('Status')).toHaveAttribute(
            'data-variant',
            variant,
        );
    });

    it('usa a variante default', () => {
        render(<DsBadge>Rascunho</DsBadge>);

        expect(screen.getByText('Rascunho')).toHaveAttribute(
            'data-variant',
            'default',
        );
    });

    it('dot mostra o ponto e esconde o ícone', () => {
        render(
            <DsBadge dot icon={<Star data-testid="icone" />}>
                Ativo
            </DsBadge>,
        );

        expect(screen.getByTestId('ds-badge-dot')).toBeInTheDocument();
        expect(screen.queryByTestId('icone')).not.toBeInTheDocument();
    });

    it('mostra o ícone sem dot', () => {
        render(<DsBadge icon={<Star data-testid="icone" />}>Novo</DsBadge>);

        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });
});

describe('DsAlert', () => {
    it.each(['info', 'success', 'warning', 'danger'] as const)(
        'variante %s é anunciada como alerta',
        (variant) => {
            render(<DsAlert variant={variant}>Mensagem</DsAlert>);

            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('data-variant', variant);
            expect(alert).toHaveTextContent('Mensagem');
        },
    );

    it('modo rich mostra título, horário e ações', () => {
        render(
            <DsAlert
                mode="rich"
                title="Sessão remarcada"
                time="há 5 min"
                actions={<button type="button">Ver agenda</button>}
            >
                O paciente pediu outro horário.
            </DsAlert>,
        );

        expect(screen.getByText('Sessão remarcada')).toBeInTheDocument();
        expect(screen.getByText('há 5 min')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Ver agenda' }),
        ).toBeInTheDocument();
    });

    it('modo compact não mostra título nem ações', () => {
        render(
            <DsAlert
                title="Título"
                actions={<button type="button">Ação</button>}
            >
                Texto
            </DsAlert>,
        );

        expect(screen.queryByText('Título')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Ação' }),
        ).not.toBeInTheDocument();
    });

    it('dismissible fecha e chama onDismiss', async () => {
        const onDismiss = vi.fn();
        const user = userEvent.setup();
        render(
            <DsAlert dismissible onDismiss={onDismiss}>
                Aviso
            </DsAlert>,
        );

        await user.click(screen.getByRole('button', { name: 'Fechar alerta' }));

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('sem dismissible não tem botão de fechar', () => {
        render(<DsAlert>Aviso</DsAlert>);

        expect(
            screen.queryByRole('button', { name: 'Fechar alerta' }),
        ).not.toBeInTheDocument();
    });

    it('usa o ícone recebido no lugar do padrão', () => {
        render(<DsAlert icon={<Star data-testid="icone" />}>Aviso</DsAlert>);

        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });
});

describe('DsBanner', () => {
    it('mostra título, descrição e é um status', () => {
        render(
            <DsBanner title="Novidade" description="Agora com prontuário v2" />,
        );

        const banner = screen.getByRole('status');
        expect(banner).toHaveAttribute('data-variant', 'brand');
        expect(banner).toHaveTextContent('Novidade');
        expect(banner).toHaveTextContent('Agora com prontuário v2');
    });

    it.each(['brand', 'info', 'warning'] as const)('variante %s', (variant) => {
        render(<DsBanner title="Aviso" variant={variant} />);

        expect(screen.getByRole('status')).toHaveAttribute(
            'data-variant',
            variant,
        );
    });

    it('CTA chama onCta', async () => {
        const onCta = vi.fn();
        const user = userEvent.setup();
        render(<DsBanner title="Novidade" ctaLabel="Conhecer" onCta={onCta} />);

        await user.click(screen.getByRole('button', { name: 'Conhecer' }));

        expect(onCta).toHaveBeenCalledTimes(1);
    });

    it('é dispensável por padrão e chama onDismiss', async () => {
        const onDismiss = vi.fn();
        const user = userEvent.setup();
        render(<DsBanner title="Novidade" onDismiss={onDismiss} />);

        await user.click(
            screen.getByRole('button', { name: 'Dispensar aviso' }),
        );

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('dismissible={false} esconde o botão', () => {
        render(<DsBanner title="Fixo" dismissible={false} />);

        expect(
            screen.queryByRole('button', { name: 'Dispensar aviso' }),
        ).not.toBeInTheDocument();
    });
});

describe('DsEmptyState', () => {
    it.each([
        [
            'empty',
            'Nenhum item cadastrado',
            'Adicione o primeiro item para começar.',
        ],
        [
            'no-results',
            'Nenhum resultado encontrado',
            'Tente ajustar os filtros ou o termo de busca.',
        ],
        [
            'no-permission',
            'Acesso restrito',
            'Você não tem permissão para visualizar este conteúdo.',
        ],
        [
            'error',
            'Não foi possível carregar',
            'Verifique sua conexão e tente novamente.',
        ],
    ] as const)(
        'variante %s usa os textos padrão do Vue',
        (variant, title, desc) => {
            render(<DsEmptyState variant={variant} />);

            expect(screen.getByText(title)).toBeInTheDocument();
            expect(screen.getByText(desc)).toBeInTheDocument();
        },
    );

    it('título, descrição, ícone e ação customizados', () => {
        render(
            <DsEmptyState
                title="Nenhum paciente"
                description="Cadastre o primeiro paciente."
                icon={<Star data-testid="icone" />}
                action={<button type="button">Cadastrar</button>}
            />,
        );

        expect(screen.getByText('Nenhum paciente')).toBeInTheDocument();
        expect(
            screen.getByText('Cadastre o primeiro paciente.'),
        ).toBeInTheDocument();
        expect(screen.getByTestId('icone')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Cadastrar' }),
        ).toBeInTheDocument();
    });
});
