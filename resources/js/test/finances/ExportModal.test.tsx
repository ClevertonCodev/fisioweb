import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    financeExportFormDefaults,
    financeExportFormSchema,
    toFinanceExportParams,
} from '@/application/clinic/finance-export-form';
import { ExportModal } from '@/pages/clinic/finances/ExportModal';

const exportFn = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-finance-export', () => ({
    apiClinicFinanceExportRepository: {
        export: (...args: unknown[]) => exportFn(...args),
    },
}));

function renderModal(onClose = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <ExportModal onClose={onClose} />
        </QueryClientProvider>,
    );
    return { onClose };
}

/** Abre o seletor do campo ("De" ou "Até") e clica no dia de outubro de 2026. */
async function pickDay(
    user: ReturnType<typeof userEvent.setup>,
    label: 'De' | 'Até',
    dayOfMonth: number,
) {
    await user.click(screen.getByLabelText(label));
    const panel = await screen.findByRole('dialog', {
        name: 'Selecionar data',
    });
    // Um mês só: o seletor de período (dois meses) não cabia no celular.
    expect(within(panel).getAllByRole('grid')).toHaveLength(1);
    const name = new RegExp(`\\b${dayOfMonth} de outubro de 2026`);
    const [button] = within(panel)
        .getAllByRole('button', { name })
        .filter(
            (b) =>
                !b.closest('[role="gridcell"]')?.hasAttribute('data-outside'),
        );
    await user.click(button!);
    await waitFor(() =>
        expect(
            screen.queryByRole('dialog', { name: 'Selecionar data' }),
        ).toBeNull(),
    );
}

beforeEach(() => {
    // Só o relógio: o calendário abre em outubro de 2026, sem travar o userEvent.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 10, 0, 0));
    exportFn.mockReset();
    exportFn.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Exportar lançamentos', () => {
    it('baixa o Excel deste mês por padrão e fecha', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal();

        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(exportFn).toHaveBeenCalledWith({
            format: 'xlsx',
            range: 'current_month',
            from: undefined,
            to: undefined,
        });
    });

    it('manda o período e o formato escolhidos', async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole('button', { name: 'Mês passado' }));
        await user.click(screen.getByRole('radio', { name: /PDF/ }));

        expect(
            screen.getByRole('button', { name: 'Mês passado' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('radio', { name: /PDF/ })).toHaveAttribute(
            'aria-checked',
            'true',
        );

        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        await waitFor(() =>
            expect(exportFn).toHaveBeenCalledWith({
                format: 'pdf',
                range: 'previous_month',
                from: undefined,
                to: undefined,
            }),
        );
    });

    it('em "Escolher datas" mostra "De" e "Até" e manda as datas clicadas', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal();

        await user.click(
            screen.getByRole('button', { name: 'Escolher datas' }),
        );
        await pickDay(user, 'De', 1);
        await pickDay(user, 'Até', 31);

        expect(screen.getByLabelText('De')).toHaveTextContent('01 Out 2026');
        expect(screen.getByLabelText('Até')).toHaveTextContent('31 Out 2026');

        await user.click(screen.getByRole('radio', { name: /CSV/ }));
        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(exportFn).toHaveBeenCalledWith({
            format: 'csv',
            range: 'custom',
            from: '2026-10-01',
            to: '2026-10-31',
        });
    });

    it('em "Escolher datas" sem as datas, mostra o erro embaixo de cada campo e não baixa', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal();

        await user.click(
            screen.getByRole('button', { name: 'Escolher datas' }),
        );
        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        const alerts = await screen.findAllByRole('alert');
        expect(alerts.map((a) => a.textContent)).toEqual([
            'Escolha a data de início.',
            'Escolha a data de fim.',
        ]);
        expect(exportFn).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();

        // Só o "De": o erro do "De" some, o do "Até" fica.
        await pickDay(user, 'De', 5);
        await waitFor(() =>
            expect(
                screen.queryByText('Escolha a data de início.'),
            ).not.toBeInTheDocument(),
        );
        expect(screen.getByText('Escolha a data de fim.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Este mês' }));
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        await waitFor(() => expect(exportFn).toHaveBeenCalledTimes(1));
        expect(exportFn).toHaveBeenCalledWith({
            format: 'xlsx',
            range: 'current_month',
            from: undefined,
            to: undefined,
        });
    });

    it('"Até" não deixa clicar antes do "De"; trocar o "De" para depois do "Até" mostra o erro no "Até"', async () => {
        const user = userEvent.setup();
        renderModal();

        await user.click(
            screen.getByRole('button', { name: 'Escolher datas' }),
        );
        await pickDay(user, 'De', 10);

        await user.click(screen.getByLabelText('Até'));
        const panel = await screen.findByRole('dialog', {
            name: 'Selecionar data',
        });
        const [ninth] = within(panel)
            .getAllByRole('button', { name: /\b9 de outubro de 2026/ })
            .filter(
                (b) =>
                    !b
                        .closest('[role="gridcell"]')
                        ?.hasAttribute('data-outside'),
            );
        expect(ninth).toHaveAttribute('data-disabled');
        await user.keyboard('{Escape}');

        await pickDay(user, 'Até', 20);
        await pickDay(user, 'De', 25);
        await user.click(screen.getByRole('button', { name: 'Baixar' }));

        expect(
            await screen.findByText('O fim não pode ser antes do início.'),
        ).toBeInTheDocument();
        expect(exportFn).not.toHaveBeenCalled();
    });
});

describe('schema de exportar', () => {
    const custom = (start: Date | null, end: Date | null) => ({
        ...financeExportFormDefaults,
        range: 'custom' as const,
        start,
        end,
    });
    const messages = (v: unknown) =>
        financeExportFormSchema
            .safeParse(v)
            .error?.issues.map((i) => `${i.path.join('.')}: ${i.message}`);

    it('em "Escolher datas" pede "De" e "Até", cada erro no seu campo, e o "Até" não vem antes', () => {
        expect(messages(custom(new Date(2026, 9, 1), null))).toEqual([
            'end: Escolha a data de fim.',
        ]);
        expect(messages(custom(null, new Date(2026, 9, 1)))).toEqual([
            'start: Escolha a data de início.',
        ]);
        expect(
            messages({ ...financeExportFormDefaults, range: 'custom' }),
        ).toEqual([
            'start: Escolha a data de início.',
            'end: Escolha a data de fim.',
        ]);
        expect(
            messages(custom(new Date(2026, 9, 10), new Date(2026, 9, 9))),
        ).toEqual(['end: O fim não pode ser antes do início.']);
        // Mesmo dia com horas diferentes conta como o mesmo dia.
        expect(
            financeExportFormSchema.safeParse(
                custom(new Date(2026, 9, 1, 18), new Date(2026, 9, 1, 8)),
            ).success,
        ).toBe(true);
        expect(
            financeExportFormSchema.safeParse(financeExportFormDefaults)
                .success,
        ).toBe(true);
    });

    it('as datas só vão para a API em "Escolher datas"', () => {
        const dates = {
            start: new Date(2026, 8, 1),
            end: new Date(2026, 8, 30),
        };

        expect(
            toFinanceExportParams({
                range: 'custom',
                ...dates,
                format: 'csv',
            }),
        ).toEqual({
            format: 'csv',
            range: 'custom',
            from: '2026-09-01',
            to: '2026-09-30',
        });
        expect(
            toFinanceExportParams({
                range: 'current_month',
                ...dates,
                format: 'csv',
            }),
        ).toEqual({
            format: 'csv',
            range: 'current_month',
            from: undefined,
            to: undefined,
        });
    });
});
