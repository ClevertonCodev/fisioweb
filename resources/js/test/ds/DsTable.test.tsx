import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pencil, Star, Trash2 } from 'lucide-react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DsTable } from '@/components/ds/table/DsTable';
import type {
    TableAction,
    TableBulkAction,
    TableColumn,
    TableProps,
} from '@/components/ds/table/types';

interface Row {
    id: number;
    nome: string;
    status: string;
    convenio?: string | null;
}

const columns: TableColumn<Row>[] = [
    { key: 'nome', label: 'Nome', sortable: true },
    { key: 'status', label: 'Status' },
];

const rows: Row[] = [
    { id: 1, nome: 'Ana Souza', status: 'ativo' },
    { id: 2, nome: 'Bruno Lima', status: 'inativo' },
    { id: 3, nome: 'Carla Dias', status: 'ativo' },
];

const bulkActions: TableBulkAction<Row>[] = [
    { key: 'delete', label: 'Excluir', icon: <Trash2 /> },
    { key: 'export', label: 'Exportar' },
];

function renderTable(props: Partial<TableProps<Row>> = {}) {
    return render(<DsTable<Row> columns={columns} rows={rows} {...props} />);
}

function bodyRows() {
    const [, body] = screen.getAllByRole('rowgroup');
    return within(body).getAllByRole('row');
}

function rowCheckboxes() {
    return screen.getAllByRole('checkbox', { name: 'Selecionar linha' });
}

describe('DsTable (casos portados do Vue)', () => {
    it('renderiza um header por coluna e uma linha por item de dados', () => {
        renderTable();

        // selectable (default true) + 2 colunas
        expect(screen.getAllByRole('columnheader')).toHaveLength(3);
        expect(
            screen.getByRole('columnheader', { name: /Nome/ }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Status' }),
        ).toBeInTheDocument();

        expect(bodyRows()).toHaveLength(rows.length);
        expect(screen.getByText('Ana Souza')).toBeInTheDocument();
        expect(screen.getByText('Carla Dias')).toBeInTheDocument();
    });

    it('chama onSort com (coluna, direção) ao clicar num header ordenável e alterna a direção', async () => {
        const onSort = vi.fn();
        const user = userEvent.setup();
        renderTable({ onSort });

        const sortButton = screen.getByRole('button', { name: /Nome/ });
        await user.click(sortButton);
        expect(onSort).toHaveBeenNthCalledWith(1, 'nome', 'asc');

        await user.click(sortButton);
        expect(onSort).toHaveBeenNthCalledWith(2, 'nome', 'desc');
    });

    it('não chama onSort ao clicar num header não ordenável', async () => {
        const onSort = vi.fn();
        const user = userEvent.setup();
        renderTable({ onSort });

        await user.click(screen.getByRole('columnheader', { name: 'Status' }));
        expect(onSort).not.toHaveBeenCalled();
        expect(
            screen.getByRole('columnheader', { name: 'Status' }),
        ).not.toHaveAttribute('aria-sort');
    });

    it('selecionar uma linha mostra a barra de ações em massa', async () => {
        const user = userEvent.setup();
        renderTable({ bulkActions });

        expect(
            screen.queryByRole('region', { name: 'Ações em massa' }),
        ).not.toBeInTheDocument();

        await user.click(rowCheckboxes()[0]);

        const bar = screen.getByRole('region', { name: 'Ações em massa' });
        expect(
            within(bar).getByRole('button', { name: 'Excluir 1 selecionado' }),
        ).toBeInTheDocument();
    });

    it('selecionar todos alterna a seleção de todas as linhas', async () => {
        const user = userEvent.setup();
        renderTable({ bulkActions });
        const all = screen.getByRole('checkbox', { name: 'Selecionar todos' });

        await user.click(all);
        expect(
            screen.getByRole('button', { name: 'Excluir 3 selecionados' }),
        ).toBeInTheDocument();
        expect(
            bodyRows().filter((r) => r.dataset.selected === 'true'),
        ).toHaveLength(rows.length);

        await user.click(all);
        expect(
            screen.queryByRole('region', { name: 'Ações em massa' }),
        ).not.toBeInTheDocument();
        expect(
            bodyRows().filter((r) => r.dataset.selected === 'true'),
        ).toHaveLength(0);
    });

    it('executar uma ação em massa chama onBulkAction com (chave, linhas selecionadas)', async () => {
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        renderTable({ bulkActions, onBulkAction });

        await user.click(rowCheckboxes()[0]);
        await user.click(rowCheckboxes()[2]);
        await user.click(
            screen.getByRole('button', { name: 'Excluir 2 selecionados' }),
        );

        expect(onBulkAction).toHaveBeenCalledWith('delete', [rows[0], rows[2]]);
    });

    it('loading exibe o skeleton e esconde os dados', () => {
        const { container } = renderTable({ loading: true });

        expect(
            container.querySelectorAll('[data-ds-table-skeleton]').length,
        ).toBeGreaterThan(0);
        expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument();
    });

    it('sem linhas exibe o emptyLabel', () => {
        const { container } = renderTable({
            rows: [],
            emptyLabel: 'Nada por aqui',
        });

        const empty = container.querySelector('[data-ds-table-empty]');
        expect(empty).toHaveTextContent('Nada por aqui');
        // ocupa a largura toda: checkbox + 2 colunas
        expect(empty).toHaveAttribute('colspan', '3');
    });

    it('renderiza conteúdo próprio de célula pela coluna (cells.status)', () => {
        renderTable({
            cells: {
                status: ({ row }) => (
                    <span data-testid="badge">{row.status.toUpperCase()}</span>
                ),
            },
        });

        const badges = screen.getAllByTestId('badge');
        expect(badges).toHaveLength(rows.length);
        expect(badges[0]).toHaveTextContent('ATIVO');
        expect(badges[1]).toHaveTextContent('INATIVO');
    });
});

describe('DsTable (ordenação)', () => {
    it('percorre asc → desc → none → asc e reflete em aria-sort', async () => {
        const onSort = vi.fn();
        const user = userEvent.setup();
        renderTable({ onSort });

        const header = screen.getByRole('columnheader', { name: /Nome/ });
        const button = within(header).getByRole('button');
        expect(header).toHaveAttribute('aria-sort', 'none');

        await user.click(button);
        expect(header).toHaveAttribute('aria-sort', 'ascending');
        await user.click(button);
        expect(header).toHaveAttribute('aria-sort', 'descending');
        await user.click(button);
        expect(header).toHaveAttribute('aria-sort', 'none');
        await user.click(button);
        expect(header).toHaveAttribute('aria-sort', 'ascending');

        expect(onSort.mock.calls).toEqual([
            ['nome', 'asc'],
            ['nome', 'desc'],
            ['nome', 'none'],
            ['nome', 'asc'],
        ]);
    });

    it('trocar de coluna recomeça em asc e zera a anterior', async () => {
        const onSort = vi.fn();
        const user = userEvent.setup();
        renderTable({
            onSort,
            columns: [
                { key: 'nome', label: 'Nome', sortable: true },
                { key: 'status', label: 'Status', sortable: true },
            ],
        });

        await user.click(screen.getByRole('button', { name: /Nome/ }));
        await user.click(screen.getByRole('button', { name: /Nome/ }));
        await user.click(screen.getByRole('button', { name: /Status/ }));

        expect(onSort).toHaveBeenLastCalledWith('status', 'asc');
        expect(
            screen.getByRole('columnheader', { name: /Nome/ }),
        ).toHaveAttribute('aria-sort', 'none');
        expect(
            screen.getByRole('columnheader', { name: /Status/ }),
        ).toHaveAttribute('aria-sort', 'ascending');
    });

    it('o cabeçalho ordenável funciona pelo teclado (Tab, Enter e Espaço)', async () => {
        const onSort = vi.fn();
        const user = userEvent.setup();
        renderTable({ onSort, selectable: false });

        await user.tab();
        expect(screen.getByRole('button', { name: /Nome/ })).toHaveFocus();

        await user.keyboard('{Enter}');
        await user.keyboard(' ');
        expect(onSort.mock.calls).toEqual([
            ['nome', 'asc'],
            ['nome', 'desc'],
        ]);
    });
});

describe('DsTable (seleção e ações em massa)', () => {
    it('selecionar todas e uma ação em lote envia todas as linhas', async () => {
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        renderTable({ bulkActions, onBulkAction });

        await user.click(
            screen.getByRole('checkbox', { name: 'Selecionar todos' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Exportar 3 selecionados' }),
        );

        expect(onBulkAction).toHaveBeenCalledWith('export', rows);
    });

    it('"selecionar todos" fica indeterminado com seleção parcial', async () => {
        const user = userEvent.setup();
        renderTable({ bulkActions });
        const all = screen.getByRole('checkbox', { name: 'Selecionar todos' });

        await user.click(rowCheckboxes()[1]);
        expect(all).toHaveAttribute('aria-checked', 'mixed');

        // a partir do parcial, o clique seleciona o resto
        await user.click(all);
        expect(all).toBeChecked();
    });

    it('"Limpar seleção" desmarca tudo e esconde a barra', async () => {
        const user = userEvent.setup();
        renderTable({ bulkActions });

        await user.click(rowCheckboxes()[0]);
        await user.click(
            screen.getByRole('button', { name: 'Limpar seleção' }),
        );

        expect(
            screen.queryByRole('region', { name: 'Ações em massa' }),
        ).not.toBeInTheDocument();
        expect(rowCheckboxes()[0]).not.toBeChecked();
    });

    it('ação em lote com visible falso não aparece', async () => {
        const user = userEvent.setup();
        renderTable({
            bulkActions: [
                ...bulkActions,
                {
                    key: 'arquivar',
                    label: 'Arquivar',
                    visible: (selected) =>
                        selected.every((r) => r.status === 'ativo'),
                },
            ],
        });

        await user.click(rowCheckboxes()[0]);
        expect(
            screen.getByRole('button', { name: 'Arquivar 1 selecionado' }),
        ).toBeInTheDocument();

        await user.click(rowCheckboxes()[1]);
        expect(
            screen.queryByRole('button', { name: /Arquivar/ }),
        ).not.toBeInTheDocument();
    });

    it('disableSelectionCb desabilita a linha e o "selecionar todos" a ignora', async () => {
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        renderTable({
            bulkActions,
            onBulkAction,
            disableSelectionCb: (row) => row.id === 2,
        });

        expect(rowCheckboxes()[1]).toBeDisabled();

        const all = screen.getByRole('checkbox', { name: 'Selecionar todos' });
        await user.click(all);
        expect(all).toBeChecked();
        await user.click(
            screen.getByRole('button', { name: 'Excluir 2 selecionados' }),
        );
        expect(onBulkAction).toHaveBeenCalledWith('delete', [rows[0], rows[2]]);
    });

    it('linhas que saem de rows saem também da seleção', async () => {
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        const { rerender } = renderTable({ bulkActions, onBulkAction });

        await user.click(rowCheckboxes()[0]);
        await user.click(rowCheckboxes()[1]);
        rerender(
            <DsTable<Row>
                columns={columns}
                rows={rows.slice(1)}
                bulkActions={bulkActions}
                onBulkAction={onBulkAction}
            />,
        );

        await user.click(
            screen.getByRole('button', { name: 'Excluir 1 selecionado' }),
        );
        expect(onBulkAction).toHaveBeenCalledWith('delete', [rows[1]]);

        // a linha voltar não traz a seleção junto
        rerender(
            <DsTable<Row>
                columns={columns}
                rows={rows}
                bulkActions={bulkActions}
            />,
        );
        expect(rowCheckboxes()[0]).not.toBeChecked();
    });

    it('linha selecionada que passa a ser bloqueada sai da seleção e do lote', async () => {
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        type Travavel = Row & { locked: boolean };
        const livres: Travavel[] = rows.map((r) => ({ ...r, locked: false }));
        const props = {
            columns,
            bulkActions,
            onBulkAction,
            disableSelectionCb: (row: Travavel) => row.locked,
        };
        const { rerender } = render(
            <DsTable<Travavel> {...props} rows={livres} />,
        );

        await user.click(rowCheckboxes()[0]);
        const travada = livres.map((r) =>
            r.id === 1 ? { ...r, locked: true } : r,
        );
        rerender(<DsTable<Travavel> {...props} rows={travada} />);

        const all = screen.getByRole('checkbox', { name: 'Selecionar todos' });
        expect(rowCheckboxes()[0]).not.toBeChecked();
        expect(all).toHaveAttribute('aria-checked', 'false');
        expect(
            screen.queryByRole('region', { name: 'Ações em massa' }),
        ).not.toBeInTheDocument();

        await user.click(rowCheckboxes()[1]);
        await user.click(
            screen.getByRole('button', { name: 'Excluir 1 selecionado' }),
        );
        expect(onBulkAction).toHaveBeenCalledWith('delete', [travada[1]]);
    });

    it('bloquear a linha só pelo disableSelectionCb (mesmas rows) também a tira da seleção', async () => {
        const user = userEvent.setup();
        const { rerender } = renderTable({ bulkActions });

        await user.click(rowCheckboxes()[0]);
        rerender(
            <DsTable<Row>
                columns={columns}
                rows={rows}
                bulkActions={bulkActions}
                disableSelectionCb={(row) => row.id === 1}
            />,
        );
        expect(rowCheckboxes()[0]).not.toBeChecked();
        expect(
            screen.queryByRole('region', { name: 'Ações em massa' }),
        ).not.toBeInTheDocument();

        // desbloquear não traz a seleção de volta
        rerender(
            <DsTable<Row>
                columns={columns}
                rows={rows}
                bulkActions={bulkActions}
            />,
        );
        expect(rowCheckboxes()[0]).not.toBeChecked();
    });
});

describe('DsTable (chave das linhas)', () => {
    // Teste que falha não pode deixar o spy de console vivo para o próximo.
    afterEach(() => {
        vi.restoreAllMocks();
    });

    interface SemId {
        nome: string;
        codigo?: string;
    }
    const semIdColumns: TableColumn<SemId>[] = [{ key: 'nome', label: 'Nome' }];

    it('linhas sem a chave: marcar uma não marca as outras, avisa em dev e não repete key', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const onBulkAction = vi.fn();
        const user = userEvent.setup();
        const semId: SemId[] = [{ nome: 'a' }, { nome: 'b' }, { nome: 'c' }];
        render(
            <DsTable<SemId>
                columns={semIdColumns}
                rows={semId}
                rowKey="codigo"
                bulkActions={[{ key: 'delete', label: 'Excluir' }]}
                onBulkAction={onBulkAction}
            />,
        );

        await user.click(rowCheckboxes()[0]);

        expect(rowCheckboxes()[0]).toBeChecked();
        expect(rowCheckboxes()[1]).not.toBeChecked();
        expect(rowCheckboxes()[2]).not.toBeChecked();
        expect(
            screen.getByRole('checkbox', { name: 'Selecionar todos' }),
        ).toHaveAttribute('aria-checked', 'mixed');
        await user.click(
            screen.getByRole('button', { name: 'Excluir 1 selecionado' }),
        );
        expect(onBulkAction).toHaveBeenCalledWith('delete', [semId[0]]);

        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining('rowKey "codigo"'),
        );
        expect(
            error.mock.calls.some((call) =>
                call.join(' ').includes('same key'),
            ),
        ).toBe(false);
    });

    it('chave repetida: marcar uma não marca a outra, avisa em dev e não repete key', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const user = userEvent.setup();
        const repetidas: Row[] = [
            { id: 1, nome: 'Ana', status: 'ativo' },
            { id: 1, nome: 'Ana de novo', status: 'ativo' },
            { id: 2, nome: 'Bruno', status: 'ativo' },
        ];
        renderTable({ rows: repetidas });

        await user.click(rowCheckboxes()[0]);
        expect(rowCheckboxes()[0]).toBeChecked();
        expect(rowCheckboxes()[1]).not.toBeChecked();

        // marcar as outras duas fecha o "selecionar todos"
        await user.click(rowCheckboxes()[1]);
        await user.click(rowCheckboxes()[2]);
        expect(
            screen.getByRole('checkbox', { name: 'Selecionar todos' }),
        ).toBeChecked();

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('repetid'));
        expect(
            error.mock.calls.some((call) =>
                call.join(' ').includes('same key'),
            ),
        ).toBe(false);
    });

    it('chaves 1 e "1" são distintas na seleção e não repetem key do React', async () => {
        const user = userEvent.setup();
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const mistas = [
            { id: 1, nome: 'Ana', status: 'ativo' },
            { id: '1', nome: 'Bruno', status: 'ativo' },
        ] as unknown as Row[];
        renderTable({ rows: mistas });

        expect(bodyRows()).toHaveLength(2);
        await user.click(rowCheckboxes()[0]);
        expect(rowCheckboxes()[0]).toBeChecked();
        expect(rowCheckboxes()[1]).not.toBeChecked();
        expect(
            error.mock.calls.some((call) =>
                call.join(' ').includes('same key'),
            ),
        ).toBe(false);
    });

    it('com todas as linhas bloqueadas, o "selecionar todos" fica desabilitado', () => {
        renderTable({ disableSelectionCb: () => true });

        expect(
            screen.getByRole('checkbox', { name: 'Selecionar todos' }),
        ).toBeDisabled();
    });

    it('chaves válidas e únicas não geram aviso', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        renderTable();
        expect(warn).not.toHaveBeenCalled();
    });
});

describe('DsTable (ações por linha)', () => {
    it('ação inline chama o handler com a linha e mostra o tooltip no hover', async () => {
        const edit = vi.fn();
        const user = userEvent.setup();
        renderTable({
            actions: [
                {
                    key: 'edit',
                    label: 'Editar',
                    icon: <Pencil />,
                    tooltip: 'Editar paciente',
                    handler: edit,
                },
            ],
        });

        expect(
            screen.getByRole('columnheader', { name: 'Ações' }),
        ).toBeInTheDocument();

        const [first] = screen.getAllByRole('button', { name: 'Editar' });
        await user.hover(first);
        expect(await screen.findByRole('tooltip')).toHaveTextContent(
            'Editar paciente',
        );

        await user.click(first);
        expect(edit).toHaveBeenCalledWith(rows[0]);
    });

    it('ação com visible falso não aparece naquela linha', () => {
        renderTable({
            actions: [
                {
                    key: 'reativar',
                    label: 'Reativar',
                    visible: (row) => row.status === 'inativo',
                    handler: vi.fn(),
                },
            ],
        });

        const buttons = screen.getAllByRole('button', { name: 'Reativar' });
        expect(buttons).toHaveLength(1);
        expect(
            within(bodyRows()[1]).getByRole('button', { name: 'Reativar' }),
        ).toBeInTheDocument();
    });

    it('ação desabilitada usa disabledLabel e não dispara; ativa usa activeLabel e aria-pressed', () => {
        const remove = vi.fn();
        renderTable({
            actions: [
                {
                    key: 'fav',
                    label: 'Favoritar',
                    activeLabel: 'Desfavoritar',
                    icon: <Star />,
                    variant: 'warning',
                    active: (row) => row.id === 1,
                    handler: vi.fn(),
                },
                {
                    key: 'remove',
                    label: 'Remover',
                    disabled: (row) => row.status === 'ativo',
                    disabledLabel: 'Paciente ativo não pode ser removido',
                    handler: remove,
                },
            ],
        });

        const [first] = bodyRows();
        expect(
            within(first).getByRole('button', { name: 'Desfavoritar' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            within(bodyRows()[1]).getByRole('button', { name: 'Favoritar' }),
        ).toHaveAttribute('aria-pressed', 'false');

        const disabled = within(first).getByRole('button', {
            name: 'Paciente ativo não pode ser removido',
        });
        expect(disabled).toBeDisabled();
    });

    it('ação com href vira link com rel seguro no _blank', () => {
        renderTable({
            actions: [
                {
                    key: 'abrir',
                    label: 'Abrir ficha',
                    href: (row) => `/pacientes/${row.id}`,
                    target: '_blank',
                    handler: vi.fn(),
                },
            ],
        });

        const [link] = screen.getAllByRole('link', { name: 'Abrir ficha' });
        expect(link).toHaveAttribute('href', '/pacientes/1');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('da quarta ação em diante vai para o menu "Opções"', async () => {
        const archive = vi.fn();
        const user = userEvent.setup();
        const actions: TableAction<Row>[] = [
            { key: 'a', label: 'Ver', handler: vi.fn() },
            { key: 'b', label: 'Editar', handler: vi.fn() },
            { key: 'c', label: 'Duplicar', handler: vi.fn() },
            {
                key: 'd',
                label: 'Arquivar',
                variant: 'danger',
                handler: archive,
            },
        ];
        renderTable({ actions });

        const second = bodyRows()[1];
        expect(
            within(second).queryByRole('button', { name: 'Arquivar' }),
        ).not.toBeInTheDocument();

        const options = within(second).getByRole('button', { name: /Opções/ });
        expect(options).toHaveAttribute('aria-haspopup', 'menu');
        await user.click(options);
        await user.click(
            await screen.findByRole('menuitem', { name: 'Arquivar' }),
        );

        expect(archive).toHaveBeenCalledWith(rows[1]);
    });
});

describe('DsTable (href no menu "Opções")', () => {
    it('ação com href no menu vira link, como a inline, e não chama o handler', async () => {
        const handler = vi.fn();
        const user = userEvent.setup();
        renderTable({
            actions: [
                { key: 'a', label: 'Ver', handler: vi.fn() },
                { key: 'b', label: 'Editar', handler: vi.fn() },
                { key: 'c', label: 'Duplicar', handler: vi.fn() },
                {
                    key: 'd',
                    label: 'Abrir ficha',
                    href: (row) => `/pacientes/${row.id}`,
                    target: '_blank',
                    handler,
                },
            ],
        });

        await user.click(
            within(bodyRows()[1]).getByRole('button', { name: /Opções/ }),
        );
        const item = await screen.findByRole('menuitem', {
            name: 'Abrir ficha',
        });
        expect(item.tagName).toBe('A');
        expect(item).toHaveAttribute('href', '/pacientes/2');
        expect(item).toHaveAttribute('target', '_blank');
        expect(item).toHaveAttribute('rel', 'noopener noreferrer');
        expect(handler).not.toHaveBeenCalled();
    });

    it('ação com href desabilitada no menu não vira link', async () => {
        const user = userEvent.setup();
        renderTable({
            actions: [
                { key: 'a', label: 'Ver', handler: vi.fn() },
                { key: 'b', label: 'Editar', handler: vi.fn() },
                { key: 'c', label: 'Duplicar', handler: vi.fn() },
                {
                    key: 'd',
                    label: 'Abrir ficha',
                    href: (row) => `/pacientes/${row.id}`,
                    disabled: () => true,
                    handler: vi.fn(),
                },
            ],
        });

        await user.click(
            within(bodyRows()[0]).getByRole('button', { name: /Opções/ }),
        );
        const item = await screen.findByRole('menuitem', {
            name: 'Abrir ficha',
        });
        expect(item).not.toHaveAttribute('href');
        expect(item).toHaveAttribute('aria-disabled', 'true');
    });
});

describe('DsTable (valores)', () => {
    it('usa render da coluna e mostra — para valor vazio', () => {
        renderTable({
            columns: [
                {
                    key: 'nome',
                    label: 'Nome',
                    render: (row) => row.nome.toUpperCase(),
                },
                { key: 'convenio', label: 'Convênio' },
            ],
            selectable: false,
        });

        expect(screen.getByText('ANA SOUZA')).toBeInTheDocument();
        expect(screen.getAllByText('—')).toHaveLength(rows.length);
    });
});
