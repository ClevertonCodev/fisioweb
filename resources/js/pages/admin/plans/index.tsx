import { Head, Link, router } from '@inertiajs/react';
import { Edit, Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Table } from '@/components/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Plan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planos',
        href: '/admin/plans',
    },
];

interface PlansProps {
    plans: {
        data: Plan[];
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
    };
}

const TYPE_CHARGE_LABELS: Record<string, string> = {
    por_usuario: 'Por Usuário',
    fixo: 'Fixo',
};

export default function Plans({ plans, filters }: PlansProps) {
    const [search, setSearch] = useState(filters.search || '');

    const applyFilters = useCallback(() => {
        router.get(
            '/admin/plans',
            {
                search: search || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, [search]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            applyFilters();
        },
        [applyFilters]
    );

    const clearFilters = useCallback(() => {
        setSearch('');
        router.get('/admin/plans', {}, { preserveState: false });
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Plans" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Planos</h1>
                    <Link href="/admin/plans/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Novo Plano
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4">
                    <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="ID ou nome do plano"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="flex items-end gap-2">
                            <Button type="submit" className="flex-1">
                                Buscar
                            </Button>
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
                            { title: 'Nome', key: 'name' },
                            { title: 'Tipo de Cobrança', key: 'type_charge' },
                            { title: 'Valor Mensal', key: 'value_month' },
                            { title: 'Valor Anual', key: 'value_year' },
                            { title: 'Ações', key: 'actions' },
                        ]}
                        data={plans.data}
                        emptyMessage="Nenhum plano encontrado"
                        pagination={{
                            links: plans.links,
                            total: plans.total,
                            currentCount: plans.data.length,
                            label: 'planos',
                            lastPage: plans.last_page,
                            currentPage: plans.current_page,
                        }}
                    >
                        {(plan) => (
                            <tr
                                key={plan.id}
                                className="border-b border-sidebar-border/70 transition-colors hover:bg-accent/50"
                            >
                                <td className="px-4 py-3 text-sm">
                                    {plan.id}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                    {plan.name}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {TYPE_CHARGE_LABELS[plan.type_charge] || plan.type_charge}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {formatCurrency(plan.value_month)}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {formatCurrency(plan.value_year)}
                                </td>
                                <td className="px-4 py-3">
                                    <Link
                                        href={`/admin/plans/${plan.id}/edit`}
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
