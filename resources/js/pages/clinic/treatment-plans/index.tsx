import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Copy,
    Download,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ExerciseCard } from '@/components/clinic/ExerciseCard';
import { ExerciseDescriptionModal } from '@/components/clinic/exercise-description-modal';
import { ExerciseFilters } from '@/components/clinic/ExerciseFilters';
import FlashMessage from '@/components/flash-message';
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
import ClinicLayout from '@/layouts/clinic-layout';
import { cn } from '@/lib/utils';
import * as treatmentPlansRoute from '@/routes/clinic/treatment-plans';
import type { BodyRegion, Exercise, Patient, PhysioArea, TreatmentPlan } from '@/types';
import type { ExerciseFilters as Filters, FilterCategory } from '@/types/exercise';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface PaginatedPlans {
    data: TreatmentPlan[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface PaginatedExercises {
    data: Exercise[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface ServerExerciseFilters {
    search?: string;
    physio_area_id?: string | string[];
    body_region_id?: string | string[];
    difficulty_level?: string | string[];
    movement_form?: string | string[];
}

interface IndexProps {
    tab: 'historico' | 'exercicios';
    // aba Histórico
    plans: PaginatedPlans;
    filters: {
        search?: string;
        status?: string;
        patient_id?: string;
        physio_area_id?: string;
    };
    statuses: Record<string, string>;
    patients: Patient[];
    // aba Exercícios
    exercises: PaginatedExercises;
    exerciseFilters: ServerExerciseFilters;
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
    // compartilhado
    physioAreas: PhysioArea[];
}

// ─── Configurações de status ───────────────────────────────────────────────────

const STATUS_BADGE_CLASS: Record<string, string> = {
    draft: 'border-border text-muted-foreground',
    active: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
    completed:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    cancelled: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
};

const STATUS_PROGRESS_CLASS: Record<string, string> = {
    draft: 'bg-muted-foreground',
    active: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-red-400',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
}

function calcProgress(startDate: string | null, endDate: string | null): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const now = Date.now();
    if (now >= end) return 100;
    if (now <= start) return 0;
    return Math.round(((now - start) / (end - start)) * 100);
}

function daysRemaining(endDate: string | null): number | null {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(date: string | null): string {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

const emptyExerciseFilters: Filters = {
    search: '',
    physio_area_id: [],
    body_region_id: [],
    difficulty_level: [],
    movement_form: [],
};

// ─── Componente principal ────────────────────────────────────────────────────

export default function Index({
    tab,
    plans,
    filters,
    statuses,
    patients,
    exercises,
    exerciseFilters: serverExerciseFilters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
}: IndexProps) {
    // ── Estado: aba Histórico ──────────────────────────────────────────────
    const [planSearch, setPlanSearch] = useState(filters.search ?? '');

    // ── Estado: aba Exercícios ─────────────────────────────────────────────
    const [showFilters, setShowFilters] = useState(true);
    const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises.data);

    useEffect(() => {
        setLocalExercises(exercises.data);
    }, [exercises.data]);
    const [descriptionModalExercise, setDescriptionModalExercise] = useState<Exercise | null>(null);
    const [exerciseSearchInput, setExerciseSearchInput] = useState(serverExerciseFilters.search ?? '');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const localExerciseFilters: Filters = useMemo(
        () => ({
            search: serverExerciseFilters.search ?? '',
            physio_area_id: toArray(serverExerciseFilters.physio_area_id),
            body_region_id: toArray(serverExerciseFilters.body_region_id),
            difficulty_level: toArray(serverExerciseFilters.difficulty_level),
            movement_form: toArray(serverExerciseFilters.movement_form),
        }),
        [serverExerciseFilters],
    );

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                id: 'physio_area_id',
                label: 'Área de Fisioterapia',
                options: physioAreas.map((a) => ({ value: String(a.id), label: a.name })),
            },
            {
                id: 'body_region_id',
                label: 'Região do Corpo',
                options: bodyRegions.map((r) => ({ value: String(r.id), label: r.name })),
            },
            {
                id: 'difficulty_level',
                label: 'Dificuldade',
                options: Object.entries(difficulties).map(([value, label]) => ({ value, label })),
            },
            {
                id: 'movement_form',
                label: 'Forma de Movimento',
                options: Object.entries(movementForms).map(([value, label]) => ({ value, label })),
            },
        ],
        [physioAreas, bodyRegions, difficulties, movementForms],
    );

    const activeFiltersCount = useMemo(
        () =>
            Object.entries(localExerciseFilters)
                .filter(([key]) => key !== 'search')
                .reduce((count, [, value]) => count + (Array.isArray(value) ? value.length : 0), 0),
        [localExerciseFilters],
    );

    // ── Navegação de tabs ───────────────────────────────────────────────────

    const goToTab = useCallback((targetTab: 'historico' | 'exercicios') => {
        router.get(
            treatmentPlansRoute.index().url,
            targetTab === 'historico' ? {} : { tab: 'exercicios' },
            { preserveState: false },
        );
    }, []);

    // ── Ações: Histórico ───────────────────────────────────────────────────

    const applyPlanSearch = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            router.get(
                treatmentPlansRoute.index().url,
                { search: planSearch || undefined },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        },
        [planSearch],
    );

    const handleDelete = useCallback((id: number, title: string) => {
        if (!confirm(`Tem certeza que deseja excluir o programa "${title}"?`)) return;
        router.delete(treatmentPlansRoute.destroy(id).url);
    }, []);

    const handleDuplicate = useCallback((id: number) => {
        router.post(treatmentPlansRoute.duplicate(id).url);
    }, []);

    // ── Ações: Exercícios ──────────────────────────────────────────────────

    const applyExerciseFilters = useCallback((newFilters: Filters) => {
        const params: Record<string, string | string[]> = { tab: 'exercicios' };
        if (newFilters.search) params.search = newFilters.search;
        if (newFilters.physio_area_id.length) params.physio_area_id = newFilters.physio_area_id;
        if (newFilters.body_region_id.length) params.body_region_id = newFilters.body_region_id;
        if (newFilters.difficulty_level.length) params.difficulty_level = newFilters.difficulty_level;
        if (newFilters.movement_form.length) params.movement_form = newFilters.movement_form;

        router.get(treatmentPlansRoute.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    useEffect(() => {
        if (tab !== 'exercicios') return;
        if (exerciseSearchInput === (serverExerciseFilters.search ?? '')) return;

        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            applyExerciseFilters({ ...localExerciseFilters, search: exerciseSearchInput });
        }, 300);

        return () => clearTimeout(searchTimerRef.current);
    }, [exerciseSearchInput, serverExerciseFilters.search, localExerciseFilters, applyExerciseFilters, tab]);

    const handleExerciseFiltersChange = (newFilters: Filters) => {
        setExerciseSearchInput(newFilters.search);
        applyExerciseFilters(newFilters);
    };

    const removeExerciseFilter = (categoryId: string, value: string) => {
        const updated = {
            ...localExerciseFilters,
            [categoryId]: (localExerciseFilters[categoryId as keyof Filters] as string[]).filter((v) => v !== value),
        };
        applyExerciseFilters(updated);
    };

    const clearAllExerciseFilters = () => {
        setExerciseSearchInput('');
        applyExerciseFilters(emptyExerciseFilters);
    };

    const getFilterLabel = (categoryId: string, value: string) => {
        const category = filterCategories.find((c) => c.id === categoryId);
        return category?.options.find((o) => o.value === value)?.label ?? value;
    };

    const handleToggleFavorite = useCallback(async (exercise: Exercise) => {
        setLocalExercises((prev) =>
            prev.map((ex) => (ex.id === exercise.id ? { ...ex, is_favorite: !ex.is_favorite } : ex)),
        );

        try {
            const rawCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')
                .slice(1)
                .join('=');
            const csrfToken = rawCookie ? decodeURIComponent(rawCookie) : undefined;

            const res = await fetch(`/clinic/exercises/${exercise.id}/toggle-favorite`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
            });

            const data = await res.json();
            setLocalExercises((prev) =>
                prev.map((ex) => (ex.id === exercise.id ? { ...ex, is_favorite: data.is_favorite } : ex)),
            );
        } catch {
            setLocalExercises((prev) =>
                prev.map((ex) => (ex.id === exercise.id ? { ...ex, is_favorite: !ex.is_favorite } : ex)),
            );
        }
    }, []);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <ClinicLayout>
            <Head title="Programas e Exercícios" />

            <div className="flex h-full flex-col">
                {/* ── Header fixo com tabs ── */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="px-6 pb-0 pt-6">
                        <FlashMessage />

                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">Programas e Exercícios</h1>
                            <Link href={treatmentPlansRoute.create().url}>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Criar programa
                                </Button>
                            </Link>
                        </div>

                        {/* Tab nav */}
                        <div className="flex gap-0">
                            <button
                                type="button"
                                onClick={() => tab !== 'historico' && goToTab('historico')}
                                className={cn(
                                    'border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                                    tab === 'historico'
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Histórico
                            </button>
                            <button
                                type="button"
                                onClick={() => tab !== 'exercicios' && goToTab('exercicios')}
                                className={cn(
                                    'border-b-2 px-4 pb-3 text-sm font-medium transition-colors',
                                    tab === 'exercicios'
                                        ? 'border-primary text-foreground'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                Exercícios
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── Conteúdo ── */}
                {tab === 'historico' ? (
                    /* ══════════════════════════ ABA: HISTÓRICO ══════════════════════════ */
                    <div className="flex-1 overflow-auto">
                        <div className="p-6">
                            {/* Busca */}
                            <form onSubmit={applyPlanSearch} className="mb-6 flex items-center gap-3">
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
                                                    const progressClass =
                                                        STATUS_PROGRESS_CLASS[plan.status] ?? 'bg-muted-foreground';
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
                                                                            {plan.patient
                                                                                ? getInitials(plan.patient.name)
                                                                                : '—'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="text-sm font-medium text-foreground">
                                                                        {plan.patient?.name ?? (
                                                                            <span className="italic text-muted-foreground">
                                                                                Template
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Programa */}
                                                            <td className="px-4 py-3">
                                                                <span className="text-sm font-medium text-foreground">
                                                                    {plan.title}
                                                                </span>
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
                                                                            {plan.clinic_user
                                                                                ? getInitials(plan.clinic_user.name)
                                                                                : '?'}
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
                                                                        <span className="ml-1 text-muted-foreground">
                                                                            ({days} dias)
                                                                        </span>
                                                                    )}
                                                                </p>
                                                                <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className={cn(
                                                                            'h-full rounded-full transition-all',
                                                                            progressClass,
                                                                        )}
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
                                                                            <a href={treatmentPlansRoute.downloadPdf(plan.id).url} target="_blank" rel="noreferrer">
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
                                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDuplicate(plan.id)}>
                                                                            <Copy className="mr-2 h-4 w-4" />
                                                                            Duplicar
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem
                                                                            onClick={() => handleDelete(plan.id, plan.title)}
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
                                    <h3 className="mb-2 text-lg font-medium text-foreground">
                                        Nenhum programa encontrado
                                    </h3>
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
                ) : (
                    /* ══════════════════════════ ABA: EXERCÍCIOS ═════════════════════════ */
                    <>
                    <div className="flex h-full min-h-0 flex-1">
                        {/* Conteúdo principal */}
                        <div className="flex min-w-0 flex-1 flex-col overflow-auto">
                            {/* Sub-header: busca + filtros (z-index acima dos cards para o badge de dificuldade não sobrepor) */}
                            <div className="sticky top-[var(--header-h,0px)] z-20 border-b border-border bg-background/95 px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Pesquisar"
                                            value={exerciseSearchInput}
                                            onChange={(e) => setExerciseSearchInput(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>
                                    <Button
                                        variant={showFilters ? 'secondary' : 'outline'}
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="gap-2"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        Filtros
                                        {activeFiltersCount > 0 && (
                                            <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </div>

                                {/* Chips de filtros ativos */}
                                {activeFiltersCount > 0 && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {Object.entries(localExerciseFilters)
                                            .filter(([key]) => key !== 'search')
                                            .map(([categoryId, values]) =>
                                                (values as string[]).map((value) => (
                                                    <Badge
                                                        key={`${categoryId}-${value}`}
                                                        variant="secondary"
                                                        className="gap-1 pr-1"
                                                    >
                                                        {getFilterLabel(categoryId, value)}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeExerciseFilter(categoryId, value)}
                                                            className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                )),
                                            )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearAllExerciseFilters}
                                            className="h-7 text-xs text-muted-foreground"
                                        >
                                            Limpar todos
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Grade de exercícios */}
                            <div className="flex-1 p-6">
                                <div className="mb-4">
                                    <p className="text-sm text-muted-foreground">
                                        {exercises.total} exercício{exercises.total !== 1 ? 's' : ''} encontrado
                                        {exercises.total !== 1 ? 's' : ''}
                                    </p>
                                </div>

                                {localExercises.length > 0 ? (
                                    <>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {localExercises.map((exercise) => (
                                                <ExerciseCard
                                                    key={exercise.id}
                                                    exercise={exercise}
                                                    isFavorite={!!exercise.is_favorite}
                                                    onToggleFavorite={handleToggleFavorite}
                                                    onInfo={(ex) => setDescriptionModalExercise(ex)}
                                                />
                                            ))}
                                        </div>

                                        {/* Paginação */}
                                        {exercises.last_page > 1 && (
                                            <div className="mt-8 flex items-center justify-center gap-2">
                                                {exercises.links.map((link, index) => {
                                                    const isFirst = index === 0;
                                                    const isLast = index === exercises.links.length - 1;
                                                    return (
                                                        <Button
                                                            key={isFirst ? 'prev' : isLast ? 'next' : link.label}
                                                            variant={link.active ? 'default' : 'outline'}
                                                            size="icon"
                                                            className="h-9 w-9"
                                                            disabled={!link.url}
                                                            asChild={!!link.url}
                                                        >
                                                            {link.url ? (
                                                                isFirst ? (
                                                                    <Link href={link.url} preserveState preserveScroll>
                                                                        <ChevronLeft className="h-4 w-4" />
                                                                    </Link>
                                                                ) : isLast ? (
                                                                    <Link href={link.url} preserveState preserveScroll>
                                                                        <ChevronRight className="h-4 w-4" />
                                                                    </Link>
                                                                ) : (
                                                                    <Link
                                                                        href={link.url}
                                                                        preserveState
                                                                        preserveScroll
                                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                                    />
                                                                )
                                                            ) : isFirst ? (
                                                                <ChevronLeft className="h-4 w-4" />
                                                            ) : isLast ? (
                                                                <ChevronRight className="h-4 w-4" />
                                                            ) : (
                                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                            )}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-medium text-foreground">
                                            Nenhum exercício encontrado
                                        </h3>
                                        <p className="max-w-md text-muted-foreground">
                                            Tente ajustar seus filtros ou buscar por outro termo.
                                        </p>
                                        <Button variant="outline" className="mt-4" onClick={clearAllExerciseFilters}>
                                            Limpar filtros
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Filtros em overlay (modal) – não empurra o conteúdo */}
                    {showFilters && (
                        <>
                            <button
                                type="button"
                                aria-label="Fechar filtros"
                                className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                                onClick={() => setShowFilters(false)}
                            />
                            <div className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col overflow-hidden border-l border-border bg-card shadow-xl animate-in slide-in-from-right duration-300">
                                <ExerciseFilters
                                    categories={filterCategories}
                                    filters={localExerciseFilters}
                                    onFiltersChange={handleExerciseFiltersChange}
                                    onClose={() => setShowFilters(false)}
                                />
                            </div>
                        </>
                    )}
                    </>
                )}
            </div>

            <ExerciseDescriptionModal
                exercise={descriptionModalExercise}
                open={!!descriptionModalExercise}
                onOpenChange={(open) => !open && setDescriptionModalExercise(null)}
            />
        </ClinicLayout>
    );
}
