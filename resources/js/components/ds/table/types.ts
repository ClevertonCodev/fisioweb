import type { ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc' | 'none';

export interface TableColumn<T = Record<string, unknown>> {
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    render?: (row: T) => string;
}

export interface TableAction<T = Record<string, unknown>> {
    key: string;
    label: string;
    /** Ícone do botão (elemento lucide). */
    icon?: ReactNode;
    variant?: 'default' | 'danger' | 'warning';
    /** Tooltip da ação inline só com ícone. `null` deixa só o nome acessível. */
    tooltip?: string | ((row: T) => string | null);
    /** Força a ação a ficar inline, mesmo depois das três primeiras. */
    inline?: boolean;
    /** Ações de alternar: quando devolve true, o botão aparece ativo. */
    active?: (row: T) => boolean;
    /** Rótulo enquanto a ação está ativa. Cai em `label`. */
    activeLabel?: string;
    /** a tabela não abre confirmação, quem usa decide. */
    confirmationLabel?: string;
    /** Quando informado, a ação só aparece se devolver true para a linha. */
    visible?: (row: T) => boolean;
    /** Quando devolve true, a ação fica desabilitada e não dispara. */
    disabled?: (row: T) => boolean;
    /** Tooltip/rótulo enquanto desabilitada, para explicar o motivo. Cai em `label`. */
    disabledLabel?: string;
    /** Renderiza a ação inline como link, preservando a navegação do navegador. */
    href?: (row: T) => string;
    /** Target do link de `href`. `_blank` também põe `rel="noopener noreferrer"`. */
    target?: '_blank' | '_self';
    handler: (row: T) => void;
}

export interface TableBulkAction<T = Record<string, unknown>> {
    key: string;
    label: string;
    icon?: ReactNode;
    /** a tabela só avisa a ação, sem confirmação. */
    confirmationLabel?: string;
    /** Quando informado, a ação só aparece se devolver true para as linhas selecionadas. */
    visible?: (rows: T[]) => boolean;
}

/** Conteúdo customizado de célula (chave = `key` da coluna). */
export type TableCellRenderer<T> = (ctx: {
    row: T;
    value: string;
}) => ReactNode;

/**
 * Campo que identifica a linha (seleção e key do React). Opcional só quando a
 * linha tem `id`; sem `id`, quem usa precisa dizer qual campo é a chave.
 */
type TableRowKeyProp<T> = 'id' extends keyof T
    ? { rowKey?: keyof T & string }
    : { rowKey: keyof T & string };

export type TableProps<T = Record<string, unknown>> = TableRowKeyProp<T> & {
    columns: TableColumn<T>[];
    rows: T[];
    selectable?: boolean;
    actions?: TableAction<T>[];
    bulkActions?: TableBulkAction<T>[];
    loading?: boolean;
    emptyLabel?: string;
    /** Quando devolve true, a linha não pode ser selecionada. */
    disableSelectionCb?: (item: T) => boolean;
    /** Ciclo por coluna: asc → desc → none. */
    onSort?: (column: string, direction: SortDirection) => void;
    /** */
    onBulkAction?: (key: string, selectedRows: T[]) => void;
    /** a chave é o `key` da coluna. */
    cells?: Partial<Record<string, TableCellRenderer<T>>>;
    className?: string;
};
