import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useCallback, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Table } from '@/components/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Clinic, type Plan } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Clinics',
        href: '/admin/clinics',
    },
];

interface ClinicsProps {
    clinics: {
        data: Clinic[];
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
    plans: Plan[];
    filters: {
        search?: string;
        plan_id?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
    };
}

const STATUS_LABELS: Record<number, string> = {
    1: 'Ativo',
    0: 'Inativo',
    [-1]: 'Cancelado',
};

const STATUS_COLORS: Record<number, string> = {
    1: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    0: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    [-1]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export default function Clinics({ clinics, plans, filters }: ClinicsProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [planId, setPlanId] = useState(filters.plan_id || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [status, setStatus] = useState(filters.status || '');

    const applyFilters = useCallback(() => {
        router.get(
            '/admin/clinics',
            {
                search: search || undefined,
                plan_id: planId || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                status: status || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    }, [search, planId, dateFrom, dateTo, status]);

    const handleSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            applyFilters();
        },
        [applyFilters]
    );

    const clearFilters = useCallback(() => {
        setSearch('');
        setPlanId('');
        setDateFrom('');
        setDateTo('');
        setStatus('');
        router.get('/admin/clinics', {}, { preserveState: false });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Clinics" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Clínicas</h1>
                    <Link href="/admin/clinics/create">
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Nova Clínica
                        </Button>
                    </Link>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-card p-4">
                    <h2 className="mb-4 text-lg font-semibold">Filtros</h2>
                    <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-5">
                        <div className="space-y-2">
                            <Label htmlFor="search">Buscar</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="text"
                                    placeholder="ID, nome ou documento"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="plan">Plano</Label>
                            <Select
                                value={planId ? planId : undefined}
                                onValueChange={(value) => setPlanId(value)}
                            >
                                <SelectTrigger id="plan">
                                    <SelectValue placeholder="Todos os planos" />
                                </SelectTrigger>
                                <SelectContent>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={String(plan.id)}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_from">Data de</Label>
                            <Input
                                id="date_from"
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_to">Data até</Label>
                            <Input
                                id="date_to"
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={status ? status : undefined}
                                onValueChange={(value) => setStatus(value)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Todos os status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Ativo</SelectItem>
                                    <SelectItem value="0">Inativo</SelectItem>
                                    <SelectItem value="-1">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
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
                            { title: 'Documento', key: 'document' },
                            { title: 'Plano', key: 'plan' },
                            { title: 'Status', key: 'status' },
                            { title: 'Data de Criação', key: 'created_at' },
                        ]}
                        data={clinics.data}
                        emptyMessage="Nenhuma clínica encontrada"
                        pagination={{
                            links: clinics.links,
                            total: clinics.total,
                            currentCount: clinics.data.length,
                            label: 'clínicas',
                            lastPage: clinics.last_page,
                            currentPage: clinics.current_page,
                        }}
                    >
                        {(clinic) => (
                            <tr
                                key={clinic.id}
                                className="border-b border-sidebar-border/70 transition-colors hover:bg-accent/50"
                            >
                                <td className="px-4 py-3 text-sm">
                                    {clinic.id}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium">
                                    {clinic.name}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {clinic.document}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                    {clinic.plan?.name || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${STATUS_COLORS[clinic.status] || STATUS_COLORS[0]}`}
                                    >
                                        {STATUS_LABELS[clinic.status] || 'Desconhecido'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                    {clinic.created_at}
                                </td>
                            </tr>
                        )}
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
