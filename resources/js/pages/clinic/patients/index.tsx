import { Head, Link, router } from '@inertiajs/react';
import { MoreVertical, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClinicLayout from '@/layouts/clinic-layout';
import type { Patient } from '@/types';

interface PaginatedPatients {
    data: Patient[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface PatientsIndexProps {
    patients: PaginatedPatients;
    filters: {
        search?: string;
        is_active?: string;
    };
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase();
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return isActive ? (
        <Badge variant="outline" className="border-primary/30 bg-primary/10 font-medium text-primary">
            Ativo
        </Badge>
    ) : (
        <Badge variant="outline" className="border-border font-medium text-muted-foreground">
            Inativo
        </Badge>
    );
}

export default function PatientsIndex({ patients, filters }: PatientsIndexProps) {
    const [activeTab, setActiveTab] = useState(filters.is_active === '0' ? 'inativos' : 'ativos');
    const [search, setSearch] = useState(filters.search ?? '');
    const [perPage, setPerPage] = useState(String(patients.per_page ?? 15));
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const applyFilters = useCallback((params: Record<string, string>) => {
        router.get('/clinic/patients', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    useEffect(() => {
        if (search === (filters.search ?? '')) return;
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            applyFilters({
                ...(search ? { search } : {}),
                ...(activeTab === 'inativos' ? { is_active: '0' } : {}),
                per_page: perPage,
            });
        }, 300);
        return () => clearTimeout(searchTimerRef.current);
    }, [search, filters.search, activeTab, applyFilters, perPage]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setSearch('');
        applyFilters({
            ...(tab === 'inativos' ? { is_active: '0' } : {}),
            per_page: perPage,
        });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        applyFilters({
            ...(search ? { search } : {}),
            ...(activeTab === 'inativos' ? { is_active: '0' } : {}),
            per_page: value,
        });
    };

    const handleDestroy = (id: number) => {
        if (!confirm('Tem certeza que deseja desvincular este paciente da clínica?')) return;
        router.delete(`/clinic/patients/${id}`, { preserveScroll: true });
    };

    return (
        <ClinicLayout>
            <Head title="Pacientes" />
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 pb-0 pt-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">Pacientes e evoluções</h1>
                            <Button asChild className="gap-2">
                                <Link href="/clinic/patients/create">
                                    <Plus className="h-4 w-4" />
                                    Novo paciente
                                </Link>
                            </Button>
                        </div>
                        <Tabs value={activeTab} onValueChange={handleTabChange}>
                            <TabsList className="h-auto gap-4 rounded-none bg-transparent p-0">
                                <TabsTrigger
                                    value="ativos"
                                    className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Ativos
                                </TabsTrigger>
                                <TabsTrigger
                                    value="inativos"
                                    className="rounded-none border-b-2 border-transparent px-1 pb-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                                >
                                    Inativos
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    <FlashMessage />

                    {/* Filtros */}
                    <div className="mb-6 flex flex-wrap items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select defaultValue="todos">
                            <SelectTrigger className="w-52">
                                <SelectValue placeholder="Todos profissionais" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos profissionais</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
                            <span>Itens por página</span>
                            <Select value={perPage} onValueChange={handlePerPageChange}>
                                <SelectTrigger className="h-9 w-16">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Tabela */}
                    <div className="rounded-lg border border-border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10"><Checkbox /></TableHead>
                                    <TableHead>Paciente</TableHead>
                                    <TableHead>Criado por</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Resumo do diagnóstico</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {patients.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                                            Nenhum paciente encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patients.data.map((patient) => (
                                        <TableRow
                                            key={patient.id}
                                            className="cursor-pointer"
                                            onClick={() => router.visit(`/clinic/patients/${patient.id}`)}
                                        >
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <Checkbox />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                            {getInitials(patient.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-foreground">{patient.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {patient.registered_by_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                                {patient.registered_by_initial}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-muted-foreground">
                                                            {patient.registered_by_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge isActive={patient.is_active} />
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">—</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => router.visit(`/clinic/patients/${patient.id}`)}>
                                                            Editar perfil
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.visit(`/clinic/patients/${patient.id}`)}>
                                                            Prontuário
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.visit(`/clinic/patients/${patient.id}?tab=programas`)}>
                                                            Programas
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.visit(`/clinic/patients/${patient.id}?tab=monitoramento`)}>
                                                            Monitoramento
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>Agendamentos</DropdownMenuItem>
                                                        <DropdownMenuItem>Pagamentos</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => handleDestroy(patient.id)}
                                                        >
                                                            Desvincular da clínica
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginação */}
                    <TablePagination
                        currentPage={patients.current_page}
                        lastPage={patients.last_page}
                        links={patients.links}
                    />
                </div>
            </div>
        </ClinicLayout>
    );
}
