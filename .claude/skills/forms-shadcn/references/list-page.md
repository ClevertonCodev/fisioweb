# ListPage — DataTable + filtros + paginação

Padrão real espelhando `pages/admin/feature/FeatureListPage.tsx`. Estrutura base de qualquer tela de listagem do projeto.

## Anatomia

```tsx
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';

import { useDelete<Entity> } from '@/application/<contexto>';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { <Entity> } from '@/domain/<contexto>';

const DEFAULT_PAGE_SIZE = 10;

const columns = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Nome', key: 'name' },
    { title: 'Status', key: 'status' },
    { title: 'Ações', key: 'actions', className: 'w-28 text-center' },
];

export default function <Entity>ListPage() {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { items, error } = useLoaderData() as {
        items: <Entity>[];
        error: string | null;
    };

    // Estado de filtros — separado entre "digitando" e "aplicado"
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('all');

    // Estado de paginação local
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const deleteMutation = useDelete<Entity>({
        onSuccess: () => revalidator.revalidate(),
    });

    // Derived — useMemo evita refazer filter+slice a cada render
    const filtered = useMemo(() => {
        return items.filter((i) => {
            const matchesSearch =
                !appliedSearch ||
                String(i.id).includes(appliedSearch) ||
                i.name.toLowerCase().includes(appliedSearch.toLowerCase());
            const matchesStatus = appliedStatus === 'all' || i.status === appliedStatus;
            return matchesSearch && matchesStatus;
        });
    }, [items, appliedSearch, appliedStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    // Handlers
    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedStatus(statusFilter);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setAppliedSearch('');
        setAppliedStatus('all');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) =>
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                {/* Erro do loader */}
                {error && (
                    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <h1 className="text-foreground text-2xl font-semibold">
                        <Entity>s
                    </h1>
                    <Button onClick={() => navigate('/admin/<entities>/novo')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo <Entity>
                    </Button>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="space-y-4 p-4">
                        <h3 className="text-foreground font-medium">Filtros</h3>
                        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-sm">Buscar</Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="ID ou nome"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-sm">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>Buscar</Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabela */}
                <DataTable<<Entity>>
                    columns={columns}
                    data={paginatedData}
                    totalLabel="<entities>"
                    totalCount={filtered.length}
                    emptyMessage="Nenhum <entity> encontrado."
                    pagination={{ currentPage, totalPages, onPageChange: handlePageChange }}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            <TableCell className="text-primary font-medium">{item.id}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>{item.status === 'active' ? 'Ativo' : 'Inativo'}</TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
                                                onClick={() =>
                                                    navigate(`/admin/<entities>/${item.id}/editar`)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Editar</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive/70 hover:text-destructive h-8 w-8 cursor-pointer"
                                                onClick={() => deleteMutation.mutate(item.id)}
                                                disabled={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables === item.id
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Excluir</TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </DataTable>
            </div>
        </AdminLayout>
    );
}
```

## Padrões reforçados

### 1. Two-state search (`search` vs `appliedSearch`)

Permite usuário digitar livremente e disparar a busca só quando clica "Buscar" (ou Enter). Evita recalcular `filtered` a cada keystroke.

```ts
const [search, setSearch] = useState('');             // o que está no input
const [appliedSearch, setAppliedSearch] = useState(''); // o que filtra a tabela

const handleSearch = () => {
    setAppliedSearch(search);
    setCurrentPage(1);   // sempre reset da paginação ao buscar
};
```

Para busca instantânea, use `useDebouncedValue` (ver [`frontend-react/references/hooks-patterns.md`](../../frontend-react/references/hooks-patterns.md#anatomia-de-hook-customizado-tipado)).

### 2. Columns fora do JSX

```tsx
// ✅ constante no topo do arquivo
const columns = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Nome', key: 'name' },
];

// ❌ inline no JSX — recria array a cada render
<DataTable columns={[{ title: 'ID', ... }]} ... />
```

### 3. `useMemo` para filtered + paginated

Cobre o caso real do projeto (lista local com 100+ itens). Para listas grandes (1000+), considere paginação server-side em vez de slice local.

### 4. Botão delete com loading **por linha**

```tsx
disabled={
    deleteMutation.isPending && deleteMutation.variables === item.id
}
```

`mutation.variables` guarda o último arg de `mutate()` — checa se é a linha atual. Sem isso, **todos** os botões ficam disabled durante qualquer delete.

### 5. Revalidar loader após delete

```tsx
const deleteMutation = useDelete<Entity>({
    onSuccess: () => revalidator.revalidate(),
});
```

`revalidator.revalidate()` força React Router a rodar o `loader` da rota atual de novo — a lista atualiza sem F5.

### 6. Loading inicial

A página é renderizada **só após** o `loader` resolver. Então não há "loading state" inicial — o loader já bloqueia. Você só precisa cuidar:

- **Vazio** após filtro → DataTable já trata via `emptyMessage`.
- **Erro** → bloco vermelho no topo (`{error && <div>...</div>}`).
- **Loading de mutation** (delete) → `disabled` nos botões.

Para mostrar "carregando" durante revalidação, use `useNavigation()`:

```tsx
import { useNavigation } from 'react-router-dom';
const navigation = useNavigation();
const isRevalidating = navigation.state === 'loading';

{isRevalidating && <div className="text-muted-foreground text-sm">Atualizando...</div>}
```

## Variação — `withQuery` em vez de loader

Para feature em que a listagem precisa atualizar com filtros que vão pro **servidor** (não filtros locais), prefira `useQuery` direto em vez do loader:

```tsx
const { data, isLoading, error } = useExercises({ search: appliedSearch, status: appliedStatus });
const items = data?.data ?? [];
```

Trade-off:
- **Loader** → bloqueia navegação até carregar (UX consistente, suspende com Suspense).
- **useQuery** → renderiza imediato com `isLoading`, mais flexível para filtros server-side.

Ambos são aceitos. Loader é o padrão "primeira carga"; useQuery brilha em filtros dinâmicos.

## DataTable props — quick reference

| Prop | Tipo | Quando |
|------|------|--------|
| `columns` | `DataTableColumn[]` | Sempre — fora do JSX |
| `data` | `T[]` | Sempre |
| `children` | `(item: T, index) => ReactNode` | Sempre — render prop por linha |
| `totalCount` | `number` | Sempre — número total **antes** da paginação |
| `emptyMessage` | `string` | Sempre — texto PT |
| `totalLabel` | `string` | "exercícios", "pacientes" — vira "Total: 42 exercícios" |
| `pagination` | `{ currentPage, totalPages, onPageChange }` | Quando há paginação |
| `pageSize` | `number` | Sempre quando há paginação |
| `pageSizeOptions` | `number[]` | Default `[5, 10, 25, 50]`; sobrescreva se precisar |
| `onPageSizeChange` | `(size: number) => void` | Sempre quando há paginação |
| `className` | `string` | Override visual raro |
