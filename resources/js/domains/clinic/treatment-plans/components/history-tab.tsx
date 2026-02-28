import { Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    Copy,
    Download,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as treatmentPlansRoute from '@/routes/clinic/treatment-plans';
import { formatDate, getInitials } from '@/lib/formatters';
import type { PaginatedResponse } from '@/types/pagination';
import type { TreatmentPlan } from '@/types';

import { calcProgress, daysRemaining, STATUS_BADGE_CLASS, STATUS_PROGRESS_CLASS } from '../utils';

interface HistoryTabProps {
    plans: PaginatedResponse<TreatmentPlan>;
    filters: {
        search?: string;
        status?: string;
        patient_id?: string;
        physio_area_id?: string;
    };
    statuses: Record<string, string>;
    planSearch: string;
    setPlanSearch: (value: string) => void;
    onSearch: (e: React.FormEvent) => void;
    onDelete: (id: number, title: string) => void;
    onDuplicate: (id: number) => void;
}

export function HistoryTab({
    plans,
    filters,
    statuses,
    planSearch,
    setPlanSearch,
    onSearch,
    onDelete,
    onDuplicate,
}: HistoryTabProps) {
    return (
        <div className="flex-1 overflow-auto">
            <div className="p-6">
                {/* Busca */}
                <form onSubmit={onSearch} className="mb-6 flex items-center gap-3">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar paciente ou programa..."
                            value={planSearch}
                            onChange={(e) => setPlanSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button type="submit" variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros
                    </Button>
                </form>

                {/* Tabela */}
                {plans.data.length > 0 ? (
                    <>
                        <div className="overflow-hidden rounded-lg border border-border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Paciente
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Programa de exercícios
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Profissional
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Validade
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="w-10 px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {plans.data.map((plan) => {
                                        const progress = calcProgress(plan.start_date, plan.end_date);
                                        const days = daysRemaining(plan.end_date);
                                        const progressClass = STATUS_PROGRESS_CLASS[plan.status] ?? 'bg-muted-foreground';
                                        const badgeClass = STATUS_BADGE_CLASS[plan.status] ?? '';

                                        return (
                                            <tr
                                                key={plan.id}
                                                className="group cursor-pointer transition-colors hover:bg-muted/30"
                                                onClick={() => router.visit(treatmentPlansRoute.show(plan.id).url)}
                                            >
                                                {/* Paciente */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                                {plan.patient ? getInitials(plan.patient.name) : '—'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium text-foreground">
                                                            {plan.patient?.name ?? (
                                                                <span className="italic text-muted-foreground">Template</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Programa */}
                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-medium text-foreground">{plan.title}</span>
                                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                                        {plan.exercises?.length ?? 0} exercício
                                                        {(plan.exercises?.length ?? 0) !== 1 ? 's' : ''}
                                                    </p>
                                                </td>

                                                {/* Profissional */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                                {plan.clinic_user ? getInitials(plan.clinic_user.name) : '?'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-muted-foreground">
                                                            {plan.clinic_user?.name ?? '—'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Validade */}
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-foreground">
                                                        {formatDate(plan.end_date)}
                                                        {days !== null && (
                                                            <span className="ml-1 text-muted-foreground">({days} dias)</span>
                                                        )}
                                                    </p>
                                                    <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className={cn('h-full rounded-full transition-all', progressClass)}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </td>

                                                {/* Status */}
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={badgeClass}>
                                                        {statuses[plan.status] ?? plan.status}
                                                    </Badge>
                                                </td>

                                                {/* Ações */}
                                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 data-[state=open]:opacity-100"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Ações</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                                <a
                                                                    href={treatmentPlansRoute.pdf(plan.id).url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                >
                                                                    <Download className="mr-2 h-4 w-4" />
                                                                    Baixar PDF
                                                                </a>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild className="cursor-pointer">
                                                                <Link href={treatmentPlansRoute.edit(plan.id).url}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Editar
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => onDuplicate(plan.id)}
                                                            >
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                Duplicar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => onDelete(plan.id, plan.title)}
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        {plans.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    {plans.total} programa{plans.total !== 1 ? 's' : ''} no total
                                </span>
                                <div className="flex items-center gap-1">
                                    {plans.links.map((link, index) => {
                                        const isFirst = index === 0;
                                        const isLast = index === plans.links.length - 1;
                                        return (
                                            <Button
                                                key={isFirst ? 'prev' : isLast ? 'next' : link.label}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                className="h-8 min-w-8 px-2"
                                                disabled={!link.url}
                                                asChild={!!link.url}
                                            >
                                                {link.url ? (
                                                    <Link
                                                        href={link.url}
                                                        preserveState
                                                        preserveScroll
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                )}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    /* Estado vazio */
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <ClipboardList className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-foreground">Nenhum programa encontrado</h3>
                        <p className="max-w-sm text-sm text-muted-foreground">
                            {filters.search
                                ? 'Tente ajustar o termo de busca.'
                                : 'Crie programas de exercícios personalizados para seus pacientes.'}
                        </p>
                        {!filters.search && (
                            <Link href={treatmentPlansRoute.create().url}>
                                <Button className="mt-4 gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar primeiro programa
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
