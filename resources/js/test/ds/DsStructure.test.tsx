import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';

import type { CardVariant } from '@/components/ds';
import { DsCard, DsKpi, DsList } from '@/components/ds';

describe('DsCard', () => {
    it('renderiza header, canto, corpo e rodapé', () => {
        render(
            <DsCard
                header={<h3>Plano de tratamento</h3>}
                corner={<button type="button">Editar</button>}
                footer={<span>Atualizado hoje</span>}
            >
                Joelho direito, 10 sessões.
            </DsCard>,
        );

        expect(
            screen.getByRole('heading', { name: 'Plano de tratamento' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Editar' }),
        ).toBeInTheDocument();
        expect(
            screen.getByText('Joelho direito, 10 sessões.'),
        ).toBeInTheDocument();
        expect(screen.getByText('Atualizado hoje')).toBeInTheDocument();
    });

    it('não renderiza partes vazias', () => {
        const { container } = render(<DsCard>Só corpo</DsCard>);

        expect(container.querySelector('[data-slot="header"]')).toBeNull();
        expect(container.querySelector('[data-slot="footer"]')).toBeNull();
        expect(container.querySelector('[data-slot="media"]')).toBeNull();
    });

    it.each<CardVariant>([
        'default',
        'outlined',
        'elevated',
        'brand',
        'interactive',
    ])('variante %s', (variant) => {
        render(<DsCard variant={variant}>Conteúdo</DsCard>);

        expect(
            screen.getByText('Conteúdo').closest('[data-variant]'),
        ).toHaveAttribute('data-variant', variant);
    });

    it('compact, horizontal e mídia', () => {
        render(
            <DsCard
                compact
                horizontal
                media={<img src="/x.png" alt="Foto do exercício" />}
            >
                Conteúdo
            </DsCard>,
        );

        const card = screen.getByText('Conteúdo').closest('[data-variant]');
        expect(card).toHaveAttribute('data-compact', 'true');
        expect(card).toHaveAttribute('data-horizontal', 'true');
        expect(screen.getByAltText('Foto do exercício')).toBeInTheDocument();
    });

    it('interactive repassa onClick', async () => {
        const onClick = vi.fn();
        const user = userEvent.setup();
        render(
            <DsCard variant="interactive" onClick={onClick}>
                Clique
            </DsCard>,
        );

        await user.click(screen.getByText('Clique'));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('DsKpi', () => {
    it('mostra rótulo, valor e ícone', () => {
        render(
            <DsKpi
                label="Pacientes ativos"
                value={128}
                icon={<Users data-testid="icone" />}
            />,
        );

        expect(screen.getByText('Pacientes ativos')).toBeInTheDocument();
        expect(screen.getByText('128')).toBeInTheDocument();
        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });

    it.each([
        ['up', 'Alta'],
        ['down', 'Queda'],
        ['neutral', 'Estável'],
    ] as const)(
        'tendência %s tem ícone e texto para leitor de tela',
        (trend, text) => {
            render(
                <DsKpi
                    label="Receita"
                    value="R$ 10 mil"
                    delta="+12%"
                    trend={trend}
                />,
            );

            const delta = screen.getByText('+12%').closest('[data-trend]');
            expect(delta).toHaveAttribute('data-trend', trend);
            expect(within(delta as HTMLElement).getByText(text)).toHaveClass(
                'sr-only',
            );
            expect(delta?.querySelector('svg')).not.toBeNull();
        },
    );

    it('sem delta não mostra tendência', () => {
        const { container } = render(<DsKpi label="Sessões" value={42} />);

        expect(container.querySelector('[data-trend]')).toBeNull();
    });

    it('delta sem tendência não mostra ícone de alta ou queda', () => {
        render(<DsKpi label="Exercícios" value={40} delta="6 categorias" />);

        expect(screen.getByText('6 categorias')).toBeInTheDocument();
        expect(
            screen.getByText('6 categorias').closest('[data-trend]'),
        ).toBeNull();
        expect(screen.queryByText('Estável')).not.toBeInTheDocument();
    });

    it('loading mostra o esqueleto no lugar do valor', () => {
        render(<DsKpi label="Sessões" value={42} loading />);

        expect(screen.queryByText('42')).not.toBeInTheDocument();
        expect(screen.getByTestId('ds-kpi-skeleton')).toBeInTheDocument();
        expect(
            screen.getByText('Sessões').closest('[aria-busy]'),
        ).toHaveAttribute('aria-busy', 'true');
    });
});

describe('DsList', () => {
    it('modo text mostra ícone, texto, sub e meta', () => {
        render(
            <DsList
                items={[
                    {
                        key: 'a',
                        icon: <Calendar data-testid="icone" />,
                        text: 'Sessão de fisioterapia',
                        sub: 'Joelho direito',
                        meta: '14h',
                    },
                    { key: 'b', text: 'Avaliação' },
                ]}
            />,
        );

        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('Sessão de fisioterapia')).toBeInTheDocument();
        expect(screen.getByText('Joelho direito')).toBeInTheDocument();
        expect(screen.getByText('14h')).toBeInTheDocument();
        expect(screen.getByTestId('icone')).toBeInTheDocument();
    });

    it('modo kv mostra rótulo e valor', () => {
        render(
            <DsList
                mode="kv"
                items={[
                    { key: 'conv', label: 'Convênio', value: 'Particular' },
                    {
                        key: 'freq',
                        label: 'Frequência',
                        value: '2x por semana',
                    },
                ]}
            />,
        );

        const items = screen.getAllByRole('listitem');
        expect(items[0]).toHaveTextContent('Convênio');
        expect(items[0]).toHaveTextContent('Particular');
        expect(items[1]).toHaveTextContent('2x por semana');
    });

    it('modo kv aceita valor customizado (slot por item do Vue)', () => {
        render(
            <DsList
                mode="kv"
                items={[{ key: 'status', label: 'Status', value: 'ativo' }]}
                renderValue={(item) => (
                    <strong>{item.value?.toUpperCase()}</strong>
                )}
            />,
        );

        expect(screen.getByText('ATIVO').tagName).toBe('STRONG');
    });
});
