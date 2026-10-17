import { Archive, Download, Eye, Pencil, Star, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type {
    SortDirection,
    TableAction,
    TableBulkAction,
    TableColumn,
} from '@/components/ds';
import { DsBadge, DsButton, DsSwitch, DsTable } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

interface PacienteExemplo {
    id: number;
    nome: string;
    convenio: string | null;
    sessoes: number;
    status: 'ativo' | 'alta' | 'pausado';
}

// Dados fictícios, só para o catálogo.
const PACIENTES: PacienteExemplo[] = [
    {
        id: 1,
        nome: 'Ana Souza',
        convenio: 'Unimed',
        sessoes: 12,
        status: 'ativo',
    },
    {
        id: 2,
        nome: 'Bruno Lima',
        convenio: null,
        sessoes: 4,
        status: 'pausado',
    },
    {
        id: 3,
        nome: 'Carla Dias',
        convenio: 'Amil',
        sessoes: 20,
        status: 'alta',
    },
    {
        id: 4,
        nome: 'Diego Rocha',
        convenio: 'Bradesco',
        sessoes: 8,
        status: 'ativo',
    },
    {
        id: 5,
        nome: 'Elisa Prado',
        convenio: 'Unimed',
        sessoes: 1,
        status: 'ativo',
    },
];

const STATUS: Record<
    PacienteExemplo['status'],
    { label: string; variant: 'success' | 'info' | 'warning' }
> = {
    ativo: { label: 'Ativo', variant: 'success' },
    alta: { label: 'Alta', variant: 'info' },
    pausado: { label: 'Pausado', variant: 'warning' },
};

const COLUMNS: TableColumn<PacienteExemplo>[] = [
    { key: 'nome', label: 'Paciente', sortable: true },
    { key: 'convenio', label: 'Convênio' },
    {
        key: 'sessoes',
        label: 'Sessões',
        sortable: true,
        width: '120px',
        render: (row) => `${row.sessoes} sess.`,
    },
    { key: 'status', label: 'Status', sortable: true },
];

function sortRows(
    rows: PacienteExemplo[],
    col: string,
    dir: SortDirection,
): PacienteExemplo[] {
    if (dir === 'none' || !col) return rows;
    const key = col as keyof PacienteExemplo;
    const sign = dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
        const x = a[key] ?? '';
        const y = b[key] ?? '';
        if (typeof x === 'number' && typeof y === 'number') {
            return (x - y) * sign;
        }
        return String(x).localeCompare(String(y), 'pt-BR') * sign;
    });
}

export function TableSection() {
    const [rows, setRows] = useState(PACIENTES);
    const [sort, setSort] = useState<{ col: string; dir: SortDirection }>({
        col: '',
        dir: 'none',
    });
    const [favoritos, setFavoritos] = useState<number[]>([1]);
    const [loading, setLoading] = useState(false);
    const [empty, setEmpty] = useState(false);
    const [result, setResult] = useState('Nenhuma ação disparada ainda.');

    const sorted = useMemo(
        () => sortRows(rows, sort.col, sort.dir),
        [rows, sort],
    );

    const actions: TableAction<PacienteExemplo>[] = [
        {
            key: 'ver',
            label: 'Ver ficha',
            icon: <Eye />,
            handler: (row) => setResult(`Ver ficha: ${row.nome}`),
        },
        {
            key: 'editar',
            label: 'Editar',
            icon: <Pencil />,
            tooltip: (row) => `Editar ${row.nome}`,
            disabled: (row) => row.status === 'alta',
            disabledLabel: 'Paciente de alta não pode ser editado',
            handler: (row) => setResult(`Editar: ${row.nome}`),
        },
        {
            key: 'favoritar',
            label: 'Favoritar',
            activeLabel: 'Remover dos favoritos',
            icon: <Star />,
            variant: 'warning',
            active: (row) => favoritos.includes(row.id),
            handler: (row) =>
                setFavoritos((list) =>
                    list.includes(row.id)
                        ? list.filter((id) => id !== row.id)
                        : [...list, row.id],
                ),
        },
        {
            key: 'pausar',
            label: 'Pausar tratamento',
            icon: <Archive />,
            visible: (row) => row.status === 'ativo',
            handler: (row) => setResult(`Pausar tratamento: ${row.nome}`),
        },
        {
            key: 'excluir',
            label: 'Excluir',
            icon: <Trash2 />,
            variant: 'danger',
            handler: (row) => {
                setRows((list) => list.filter((r) => r.id !== row.id));
                setResult(`Excluir: ${row.nome}`);
            },
        },
    ];

    const bulkActions: TableBulkAction<PacienteExemplo>[] = [
        { key: 'exportar', label: 'Exportar', icon: <Download /> },
        {
            key: 'pausar',
            label: 'Pausar',
            icon: <Archive />,
            // só aparece quando todas as selecionadas estão em tratamento
            visible: (selected) => selected.every((r) => r.status === 'ativo'),
        },
        { key: 'excluir', label: 'Excluir', icon: <Trash2 /> },
    ];

    function handleBulkAction(key: string, selected: PacienteExemplo[]) {
        const nomes = selected.map((r) => r.nome).join(', ');
        setResult(`Ação em lote "${key}" com ${selected.length}: ${nomes}`);
        if (key === 'excluir') {
            const ids = new Set(selected.map((r) => r.id));
            setRows((list) => list.filter((r) => !ids.has(r.id)));
        }
    }

    return (
        <CatalogSection
            id="tabela"
            title="Tabela"
            description="Cabeçalho ordenável (asc → desc → sem ordem), seleção de linhas, ações por linha com tooltip e menu Opções, e ações em lote."
        >
            <CatalogRow label="Estados">
                <DsSwitch
                    label="Carregando"
                    checked={loading}
                    onCheckedChange={setLoading}
                />
                <DsSwitch
                    label="Sem linhas"
                    checked={empty}
                    onCheckedChange={setEmpty}
                />
                <DsButton
                    label="Restaurar dados"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        setRows(PACIENTES);
                        setResult('Dados restaurados.');
                    }}
                />
            </CatalogRow>
            <CatalogRow label="Pacientes (ordenável, selecionável, com ações)">
                <div className="flex w-full flex-col gap-3">
                    <DsTable<PacienteExemplo>
                        columns={COLUMNS}
                        rows={empty ? [] : sorted}
                        loading={loading}
                        actions={actions}
                        bulkActions={bulkActions}
                        emptyLabel="Nenhum paciente encontrado."
                        onSort={(col, dir) => setSort({ col, dir })}
                        onBulkAction={handleBulkAction}
                        cells={{
                            convenio: ({ row, value }) =>
                                row.convenio ? (
                                    value
                                ) : (
                                    <span className="text-ds-content-subtle">
                                        Particular
                                    </span>
                                ),
                            status: ({ row }) => (
                                <DsBadge variant={STATUS[row.status].variant}>
                                    {STATUS[row.status].label}
                                </DsBadge>
                            ),
                        }}
                    />
                    <p
                        role="status"
                        className="font-ds text-ds-body-xs text-ds-content-muted"
                    >
                        <span className="font-medium text-ds-content-primary">
                            Resultado:
                        </span>{' '}
                        {result}
                        {sort.dir !== 'none' &&
                            ` · Ordenado por ${sort.col} (${sort.dir})`}
                    </p>
                </div>
            </CatalogRow>
            <CatalogRow label="Sem seleção e sem ações">
                <div className="w-full">
                    <DsTable<PacienteExemplo>
                        columns={COLUMNS.slice(0, 2)}
                        rows={PACIENTES.slice(0, 3)}
                        selectable={false}
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
