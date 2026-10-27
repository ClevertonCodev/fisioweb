import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { FilterChip } from '@/components/ds';
import { DsFilterChips } from '@/components/ds';

const CHIPS: FilterChip[] = [
    { key: 'status:alta', label: 'Status', value: 'Alta' },
    { key: 'situacao', label: 'Situação', value: 'Ativos' },
];

describe('DsFilterChips', () => {
    it('mostra cada filtro como "Rótulo: valor"', () => {
        render(<DsFilterChips chips={CHIPS} onRemove={() => {}} />);

        expect(screen.getByText('Status: Alta')).toBeInTheDocument();
        expect(screen.getByText('Situação: Ativos')).toBeInTheDocument();
    });

    it('sem rótulo mostra só o valor', () => {
        render(
            <DsFilterChips
                chips={[{ key: 'busca', value: 'joão' }]}
                onRemove={() => {}}
            />,
        );

        expect(screen.getByText('joão')).toBeInTheDocument();
    });

    it('o × remove só aquele filtro', async () => {
        const onRemove = vi.fn();
        render(<DsFilterChips chips={CHIPS} onRemove={onRemove} />);

        await userEvent.click(
            screen.getByRole('button', { name: 'Remover filtro Status: Alta' }),
        );

        expect(onRemove).toHaveBeenCalledTimes(1);
        expect(onRemove).toHaveBeenCalledWith(CHIPS[0]);
    });

    it('"Limpar filtros" só aparece com onClear e chama o callback', async () => {
        const onClear = vi.fn();
        const { rerender } = render(
            <DsFilterChips chips={CHIPS} onRemove={() => {}} />,
        );
        expect(
            screen.queryByRole('button', { name: 'Limpar filtros' }),
        ).not.toBeInTheDocument();

        rerender(
            <DsFilterChips
                chips={CHIPS}
                onRemove={() => {}}
                onClear={onClear}
            />,
        );
        await userEvent.click(
            screen.getByRole('button', { name: 'Limpar filtros' }),
        );

        expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('aceita outro texto para limpar', () => {
        render(
            <DsFilterChips
                chips={CHIPS}
                onRemove={() => {}}
                onClear={() => {}}
                clearLabel="Limpar tudo"
            />,
        );

        expect(
            screen.getByRole('button', { name: 'Limpar tudo' }),
        ).toBeInTheDocument();
    });

    it('sem filtros não renderiza nada', () => {
        const { container } = render(
            <DsFilterChips chips={[]} onRemove={() => {}} onClear={() => {}} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    it('a lista tem nome acessível', () => {
        render(<DsFilterChips chips={CHIPS} onRemove={() => {}} />);

        expect(
            screen.getByRole('list', { name: 'Filtros aplicados' }),
        ).toBeInTheDocument();
    });
});
