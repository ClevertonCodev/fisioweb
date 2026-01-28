import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table } from '@/components/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Feature } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Funcionalidades',
        href: '/admin/functionalities',
    },
];

interface FunctionalitiesProps {
    functionalities: {
        data: Feature[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: {
        search?: string;
        type?: string;
    };
    types: Record<string, string>;
}

export default function FunctionalitiesIndex({
    functionalities,
    filters,
    types,
}: FunctionalitiesProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || '');

    const applyFilters = useCallback(() => {
        router.get(
            '/admin/functionalities',
            {
                search: search || undefined,
                type: typeFilter || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, [search, typeFilter]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            applyFilters();
        },
        [applyFilters]
    );

    const clearFilters = useCallback(() => {
        setSearch('');
        setTypeFilter('');
        router.get(
            '/admin/functionalities',
            {},
            { preserveState: false }
        );
    }, []);

    const formatCurrency = (value: number | null) => {
        if (value === null || value === undefined) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Funcionalidades" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Funcionalidades</h1>
                    <Link href="/admin/functionalities/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Nova Funcionalidade
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4">
                    <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
                    <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                        <div className="flex-1 space-y-2 min-w-[200px]">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="ID, chave ou nome"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                        <div className="flex-1 space-y-2 min-w-[200px]">
                            <Label htmlFor="type">Tipo</Label>
                            <Select
                                value={typeFilter || undefined}
                                onValueChange={(value) => setTypeFilter(value)}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Todos os tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(types).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="submit">Buscar</Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFilters}
                            >
                                Limpar
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="flex-1">
                    <Table
                        columns={[
                            { title: 'ID', key: 'id' },
                            { title: 'Chave', key: 'key' },
                            { title: 'Nome', key: 'name' },
                            { title: 'Valor Isolado', key: 'value_isolated' },
                            { title: 'Tipo', key: 'type' },
                            { title: 'Ações', key: 'actions' },
                        ]}
                        data={functionalities.data}
                        emptyMessage="Nenhuma funcionalidade encontrada"
                        pagination={{
                            links: functionalities.links,
                            total: functionalities.total,
                            currentCount: functionalities.data.length,
                            label: 'funcionalidades',
                            lastPage: functionalities.last_page,
                            currentPage: functionalities.current_page,
                        }}
                    >
                        {(feature) => (
                            <tr
                                key={feature.id}
                                className="border-b border-sidebar-border/70 transition-colors hover:bg-accent/50"
                            >
                                <td className="px-4 py-3 text-sm">
                                    {feature.id}
                                </td>
                                <td className="px-4 py-3 text-sm font-mono">
                                    {feature.key}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                    {feature.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {formatCurrency(feature.value_isolated)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {types[feature.type] || feature.type}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/functionalities/${feature.id}/edit`}
                                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <Edit className="size-4" />
                                        Editar
                                    </Link>
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
