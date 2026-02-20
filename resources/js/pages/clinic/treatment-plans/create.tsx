import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ClipboardList, Copy, Dumbbell, Filter, GripVertical, Pencil, Play, Plus, Search, Settings2, Star, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ExerciseCard } from '@/components/clinic/ExerciseCard';
import { ExerciseDescriptionModal } from '@/components/clinic/exercise-description-modal';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import ClinicLayout from '@/layouts/clinic-layout';
import { cn } from '@/lib/utils';
import type { Exercise, Patient, PhysioArea } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExerciseConfig {
    exercise_id: number;
    exercise: Exercise;
    group_index: number | null; // índice do grupo local
    days_of_week: string[];
    all_days: boolean;
    period: string; // morning | afternoon | night | ''
    sets_min: string;
    sets_max: string;
    repetitions_min: string;
    repetitions_max: string;
    load_min: string;
    load_max: string;
    rest_time: string;
    notes: string;
    sort_order: number;
}

interface Group {
    name: string;
    sort_order: number;
}

interface CreateProps {
    patients: Patient[];
    physioAreas: PhysioArea[];
    physioSubareas: { id: number; name: string; physio_area_id: number }[];
    statuses: Record<string, string>;
    periods: Record<string, string>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = [
    { value: 'sun', label: 'D' },
    { value: 'mon', label: 'S' },
    { value: 'tue', label: 'T' },
    { value: 'wed', label: 'Q' },
    { value: 'thu', label: 'Q' },
    { value: 'fri', label: 'S' },
    { value: 'sat', label: 'S' },
];

const SETS_OPTIONS = ['', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
const REPS_OPTIONS = ['', '5', '8', '10', '12', '15', '20', '25', '30'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExerciseSpecs(cfg: ExerciseConfig): string {
    const parts: string[] = [];
    if (cfg.sets_min || cfg.sets_max) {
        const s = cfg.sets_min === cfg.sets_max ? cfg.sets_min : `${cfg.sets_min || '?'}-${cfg.sets_max || '?'}`;
        parts.push(`${s} série${Number(cfg.sets_max) !== 1 ? 's' : ''}`);
    }
    if (cfg.repetitions_min || cfg.repetitions_max) {
        const r = cfg.repetitions_min === cfg.repetitions_max ? cfg.repetitions_min : `${cfg.repetitions_min || '?'}-${cfg.repetitions_max || '?'}`;
        parts.push(`${r} rep.`);
    }
    if (cfg.period) {
        const labels: Record<string, string> = { morning: 'Manhã', afternoon: 'Tarde', night: 'Noite' };
        parts.push(labels[cfg.period] ?? cfg.period);
    }
    return parts.join(' · ') || 'Sem especificações';
}

function getExerciseThumbnail(exercise: Exercise): string | null {
    return exercise.videos?.[0]?.thumbnail_url ?? null;
}

function hasConfig(cfg: ExerciseConfig): boolean {
    return !!(cfg.sets_min || cfg.sets_max || cfg.period || cfg.days_of_week.length);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExerciseThumb({ exercise, size = 'md' }: { exercise: Exercise; size?: 'sm' | 'md' }) {
    const thumb = getExerciseThumbnail(exercise);
    const sizeClass = size === 'sm' ? 'h-12 w-16' : 'h-16 w-20';
    return (
        <div className={cn('relative flex-shrink-0 overflow-hidden rounded-md bg-teal-600', sizeClass)}>
            {thumb ? (
                <img src={thumb} alt={exercise.name} className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-white/60" />
                </div>
            )}
            {exercise.videos?.[0]?.cdn_url && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/80">
                        <Play className="ml-0.5 h-3 w-3 text-teal-700" />
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Step 1: Selecionar Exercícios ────────────────────────────────────────────

interface Step1Props {
    physioAreas: PhysioArea[];
    selected: ExerciseConfig[];
    onSelect: (exercise: Exercise) => void;
    onRemove: (exerciseId: number) => void;
    onAdvance: () => void;
}

function Step1({ physioAreas, selected, onSelect, onRemove, onAdvance }: Step1Props) {
    const [search, setSearch] = useState('');
    const [areaId, setAreaId] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [panelOpen, setPanelOpen] = useState(false);
    const [descriptionExercise, setDescriptionExercise] = useState<Exercise | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchExercises = useCallback(
        (q: string, area: string, p: number, favOnly: boolean) => {
            setLoading(true);
            const params = new URLSearchParams();
            if (q) params.set('search', q);
            if (area) params.set('physio_area_id', area);
            if (favOnly) params.set('favorites_only', '1');
            params.set('per_page', '24');
            params.set('page', String(p));

            fetch(`/clinic/exercises/search?${params}`, {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
                .then((r) => r.json())
                .then((res) => {
                    const data = res.data?.data ?? res.data ?? [];
                    setExercises(Array.isArray(data) ? data : []);
                    setLastPage(res.data?.last_page ?? 1);
                })
                .catch(() => setExercises([]))
                .finally(() => setLoading(false));
        },
        [],
    );

    useEffect(() => {
        fetchExercises('', '', 1, false);
    }, [fetchExercises]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchExercises(val, areaId, 1, favoritesOnly), 400);
    };

    const handleAreaChange = (val: string) => {
        const next = areaId === val ? '' : val;
        setAreaId(next);
        setPage(1);
        fetchExercises(search, next, 1, favoritesOnly);
    };

    const handlePageChange = (p: number) => {
        setPage(p);
        fetchExercises(search, areaId, p, favoritesOnly);
    };

    const handleToggleFavoritesFilter = () => {
        const next = !favoritesOnly;
        setFavoritesOnly(next);
        setPage(1);
        fetchExercises(search, areaId, 1, next);
    };

    const handleToggleFavorite = async (exercise: Exercise) => {
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
            setExercises((prev) =>
                prev.map((ex) =>
                    ex.id === exercise.id ? { ...ex, is_favorite: data.is_favorite } : ex,
                ),
            );
        } catch {
            // silently fail
        }
    };

    const isSelected = (id: number) => selected.some((s) => s.exercise_id === id);
    const hasSelected = selected.length > 0;

    const handleExerciseSelect = (exercise: Exercise) => {
        if (isSelected(exercise.id)) {
            onRemove(exercise.id);
        } else {
            onSelect(exercise);
            if (!panelOpen) setPanelOpen(true);
        }
    };

    return (
        <div className="flex h-full">
            {/* Left: exercise grid */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border p-4">
                    <button
                        type="button"
                        onClick={() => router.visit('/clinic/treatment-plans')}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                    </button>
                    <h1 className="text-lg font-semibold">Novo programa</h1>
                </div>

                {/* Search + filter bar */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant={favoritesOnly ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={handleToggleFavoritesFilter}
                    >
                        <Star className={cn('h-4 w-4', favoritesOnly && 'fill-current')} />
                        Favoritos
                    </Button>
                    <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                </div>

                {/* Area filter chips */}
                {showFilters && (
                    <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
                        {physioAreas.map((area) => (
                            <button
                                key={area.id}
                                type="button"
                                onClick={() => handleAreaChange(String(area.id))}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    areaId === String(area.id)
                                        ? 'border-teal-600 bg-teal-600 text-white'
                                        : 'border-border bg-background text-foreground hover:border-teal-600',
                                )}
                            >
                                {area.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : exercises.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Dumbbell className="h-10 w-10 opacity-30" />
                            <p>Nenhum exercício encontrado</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {exercises.map((ex) => (
                                    <ExerciseCard
                                        key={ex.id}
                                        exercise={ex}
                                        selected={isSelected(ex.id)}
                                        onSelect={handleExerciseSelect}
                                        onToggleFavorite={handleToggleFavorite}
                                        isFavorite={!!ex.is_favorite}
                                        onInfo={(exercise) => setDescriptionExercise(exercise)}
                                    />
                                ))}
                            </div>
                            {/* Pagination */}
                            {lastPage > 1 && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {page} / {lastPage}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === lastPage}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right: selected panel - só aparece quando tem exercícios selecionados */}
            {hasSelected && (
                <>
                    {panelOpen ? (
                        <div className="flex w-72 flex-shrink-0 flex-col border-l border-border">
                            <div className="flex items-center justify-between border-b border-border p-4">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPanelOpen(false)}
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950"
                                        title="Fechar painel"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-0 truncate font-semibold">
                                        {selected.length} {selected.length === 1 ? 'exercício selecionado' : 'exercícios selecionados'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                                {selected.map((cfg) => (
                                    <div key={cfg.exercise_id} className="flex items-center gap-2">
                                        <ExerciseThumb exercise={cfg.exercise} size="sm" />
                                        <p className="line-clamp-2 min-w-0 flex-1 text-xs font-medium">{cfg.exercise.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(cfg.exercise_id)}
                                            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-border p-4">
                                <Button
                                    className="w-full bg-teal-600 text-white hover:bg-teal-700"
                                    disabled={selected.length === 0}
                                    onClick={onAdvance}
                                >
                                    Avançar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Botão flutuante para reabrir o painel */
                        <div className="flex flex-shrink-0 items-center pl-4">
                            <button
                                type="button"
                                onClick={() => setPanelOpen(true)}
                                className="flex items-center gap-3 rounded-xl border-0 bg-teal-600 px-4 py-3 text-left text-white shadow-md transition-colors hover:bg-teal-700"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Programa com</p>
                                    <p className="text-base font-bold">
                                        {selected.length} exercício{selected.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal de descrição */}
            <ExerciseDescriptionModal
                exercise={descriptionExercise}
                open={!!descriptionExercise}
                onOpenChange={(open) => !open && setDescriptionExercise(null)}
            />
        </div>
    );
}

// ─── Step 2 & 3: Configurar Exercícios ────────────────────────────────────────

interface Step2Props {
    configs: ExerciseConfig[];
    groups: Group[];
    onUpdateConfigs: (configs: ExerciseConfig[]) => void;
    onUpdateGroups: (groups: Group[]) => void;
    onBack: () => void;
    onAdvance: () => void;
}

function Step2({ configs, groups, onUpdateConfigs, onUpdateGroups, onBack, onAdvance }: Step2Props) {
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
    const [groupNameDraft, setGroupNameDraft] = useState('');
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOver, setDragOver] = useState<number | null>(null);
    const [defaultGroupName, setDefaultGroupName] = useState('Novo grupo');
    const [editingDefaultGroup, setEditingDefaultGroup] = useState(false);
    const [defaultGroupNameDraft, setDefaultGroupNameDraft] = useState('');

    const editedCount = configs.filter(hasConfig).length;

    // Drag & drop
    const handleDragStart = (i: number) => setDragIndex(i);
    const handleDragOver = (e: React.DragEvent, i: number) => {
        e.preventDefault();
        setDragOver(i);
    };
    const handleDrop = (toIndex: number) => {
        if (dragIndex === null || dragIndex === toIndex) {
            setDragIndex(null);
            setDragOver(null);
            return;
        }
        const next = [...configs];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(toIndex, 0, moved);
        onUpdateConfigs(next.map((c, i) => ({ ...c, sort_order: i })));
        setDragIndex(null);
        setDragOver(null);
    };

    const removeExercise = (i: number) => {
        onUpdateConfigs(configs.filter((_, idx) => idx !== i).map((c, i2) => ({ ...c, sort_order: i2 })));
        if (editingIndex === i) setEditingIndex(null);
    };

    const duplicateExercise = (i: number) => {
        const copy = { ...configs[i], sort_order: configs.length };
        onUpdateConfigs([...configs, copy]);
    };

    const startRenameDefaultGroup = () => {
        setEditingDefaultGroup(true);
        setDefaultGroupNameDraft(defaultGroupName);
    };

    const commitRenameDefaultGroup = () => {
        if (defaultGroupNameDraft.trim()) setDefaultGroupName(defaultGroupNameDraft.trim());
        setEditingDefaultGroup(false);
    };

    const duplicateDefaultGroup = () => {
        const copies = configs.map((c, i) => ({ ...c, sort_order: configs.length + i }));
        onUpdateConfigs([...configs, ...copies]);
    };

    const duplicateGroup = (gi: number) => {
        const groupConfigs = configs.filter((c) => c.group_index === gi || (gi === 0 && c.group_index === null));
        const newGroupIndex = groups.length;
        const newGroup = { name: `${groups[gi].name} (cópia)`, sort_order: newGroupIndex };
        const copies = groupConfigs.map((c, i) => ({ ...c, group_index: newGroupIndex, sort_order: configs.length + i }));
        onUpdateGroups([...groups, newGroup]);
        onUpdateConfigs([...configs, ...copies]);
    };

    const addGroup = () => {
        onUpdateGroups([...groups, { name: `Novo grupo ${groups.length + 1}`, sort_order: groups.length }]);
    };

    const startRenameGroup = (i: number) => {
        setEditingGroupIndex(i);
        setGroupNameDraft(groups[i].name);
    };

    const commitRenameGroup = () => {
        if (editingGroupIndex === null) return;
        const next = groups.map((g, i) => (i === editingGroupIndex ? { ...g, name: groupNameDraft } : g));
        onUpdateGroups(next);
        setEditingGroupIndex(null);
    };

    // Edit panel updater
    const updateConfig = useCallback(
        (field: keyof ExerciseConfig, value: unknown) => {
            if (editingIndex === null) return;
            onUpdateConfigs(configs.map((c, i) => (i === editingIndex ? { ...c, [field]: value } : c)));
        },
        [editingIndex, configs, onUpdateConfigs],
    );

    const toggleDay = (day: string) => {
        if (editingIndex === null) return;
        const cfg = configs[editingIndex];
        const days = cfg.days_of_week.includes(day) ? cfg.days_of_week.filter((d) => d !== day) : [...cfg.days_of_week, day];
        updateConfig('days_of_week', days);
        if (days.length === 7) updateConfig('all_days', true);
        else updateConfig('all_days', false);
    };

    const toggleAllDays = (checked: boolean) => {
        updateConfig('all_days', checked);
        updateConfig('days_of_week', checked ? DAYS.map((d) => d.value) : []);
    };

    const editingCfg = editingIndex !== null ? configs[editingIndex] : null;

    return (
        <div className="flex h-full">
            {/* Main config area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Voltar
                        </button>
                        <h1 className="text-lg font-semibold">Configurar exercícios</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {editedCount} de {configs.length} editados
                        </span>
                        <Button className="bg-teal-600 text-white hover:bg-teal-700" onClick={onAdvance}>
                            Avançar
                        </Button>
                    </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    {/* Add group button */}
                    <div className="flex justify-start">
                        <Button variant="outline" size="sm" onClick={addGroup} className="gap-2">
                            <Plus className="h-3.5 w-3.5" />
                            Novo grupo
                        </Button>
                    </div>

                    {/* Group: "Novo grupo" with all exercises */}
                    {groups.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <div className="flex items-center gap-2">
                                    {editingDefaultGroup ? (
                                        <input
                                            value={defaultGroupNameDraft}
                                            onChange={(e) => setDefaultGroupNameDraft(e.target.value)}
                                            onBlur={commitRenameDefaultGroup}
                                            onKeyDown={(e) => e.key === 'Enter' && commitRenameDefaultGroup()}
                                            className="h-7 w-40 rounded-md border border-border bg-background px-2 text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <>
                                            <span className="font-medium">{defaultGroupName}</span>
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                                                {configs.length}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={startRenameDefaultGroup}
                                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={duplicateDefaultGroup}
                                    title="Duplicar grupo"
                                    className="cursor-pointer text-muted-foreground hover:text-foreground"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="divide-y divide-border">
                                {configs.map((cfg, i) => (
                                    <ExerciseRow
                                        key={`${cfg.exercise_id}-${i}`}
                                        cfg={cfg}
                                        index={i}
                                        isEditing={editingIndex === i}
                                        isDragging={dragIndex === i}
                                        isDragOver={dragOver === i}
                                        onEdit={() => setEditingIndex(editingIndex === i ? null : i)}
                                        onRemove={() => removeExercise(i)}
                                        onDuplicate={() => duplicateExercise(i)}
                                        onDragStart={() => handleDragStart(i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={() => handleDrop(i)}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            {groups.map((group, gi) => {
                                const groupConfigs = configs.filter((c) => c.group_index === gi);
                                const ungrouped = gi === 0 ? configs.filter((c) => c.group_index === null) : [];
                                const allInGroup = gi === 0 ? [...groupConfigs, ...ungrouped] : groupConfigs;
                                return (
                                    <div key={gi} className="rounded-xl border border-border bg-card">
                                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {editingGroupIndex === gi ? (
                                                    <Input
                                                        value={groupNameDraft}
                                                        onChange={(e) => setGroupNameDraft(e.target.value)}
                                                        onBlur={commitRenameGroup}
                                                        onKeyDown={(e) => e.key === 'Enter' && commitRenameGroup()}
                                                        className="h-7 w-40 text-sm"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <>
                                                        <span className="font-medium">{group.name}</span>
                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                                                            {allInGroup.length}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => startRenameGroup(gi)}
                                                            className="cursor-pointer text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => duplicateGroup(gi)}
                                                title="Duplicar grupo"
                                                className="cursor-pointer text-muted-foreground hover:text-foreground"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="divide-y divide-border">
                                            {allInGroup.map((cfg) => {
                                                const i = configs.indexOf(cfg);
                                                return (
                                                    <ExerciseRow
                                                        key={`${cfg.exercise_id}-${i}`}
                                                        cfg={cfg}
                                                        index={i}
                                                        isEditing={editingIndex === i}
                                                        isDragging={dragIndex === i}
                                                        isDragOver={dragOver === i}
                                                        onEdit={() => setEditingIndex(editingIndex === i ? null : i)}
                                                        onRemove={() => removeExercise(i)}
                                                        onDuplicate={() => duplicateExercise(i)}
                                                        onDragStart={() => handleDragStart(i)}
                                                        onDragOver={(e) => handleDragOver(e, i)}
                                                        onDrop={() => handleDrop(i)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Right: Edit exercise panel */}
            {editingCfg && (
                <div className="flex w-80 flex-shrink-0 flex-col border-l border-border">
                    <div className="flex items-center justify-between border-b border-border p-4">
                        <h2 className="font-semibold">Editar exercício</h2>
                        <button type="button" onClick={() => setEditingIndex(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="flex-1 space-y-5 overflow-y-auto p-4">
                        {/* Dias da semana */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Dias da semana</p>
                            <div className="flex gap-1.5">
                                {DAYS.map((day) => (
                                    <button
                                        key={day.value}
                                        type="button"
                                        onClick={() => toggleDay(day.value)}
                                        className={cn(
                                            'flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition-colors',
                                            editingCfg.days_of_week.includes(day.value)
                                                ? 'border-teal-600 bg-teal-600 text-white'
                                                : 'border-border bg-background text-foreground hover:border-teal-600',
                                        )}
                                    >
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <Checkbox
                                    id="all-days"
                                    checked={editingCfg.all_days}
                                    onCheckedChange={(c) => toggleAllDays(!!c)}
                                />
                                <label htmlFor="all-days" className="cursor-pointer text-sm">
                                    Todos os dias
                                </label>
                            </div>
                        </div>

                        {/* Período */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Período</p>
                            <div className="flex gap-2">
                                {[
                                    { value: 'morning', label: 'Manhã' },
                                    { value: 'afternoon', label: 'Tarde' },
                                    { value: 'night', label: 'Noite' },
                                ].map((p) => (
                                    <button
                                        key={p.value}
                                        type="button"
                                        onClick={() => updateConfig('period', editingCfg.period === p.value ? '' : p.value)}
                                        className={cn(
                                            'flex-1 rounded-lg border py-2 text-sm font-medium transition-colors',
                                            editingCfg.period === p.value
                                                ? 'border-teal-600 bg-teal-600 text-white'
                                                : 'border-border bg-background hover:border-teal-600',
                                        )}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Séries */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Séries</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.sets_min}
                                        onChange={(e) => updateConfig('sets_min', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Mínima</option>
                                        {SETS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.sets_max}
                                        onChange={(e) => updateConfig('sets_max', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Máxima</option>
                                        {SETS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Repetições */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Repetições</p>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.repetitions_min}
                                        onChange={(e) => updateConfig('repetitions_min', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Mínima</option>
                                        {REPS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <select
                                        value={editingCfg.repetitions_max}
                                        onChange={(e) => updateConfig('repetitions_max', e.target.value)}
                                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Máxima</option>
                                        {REPS_OPTIONS.slice(1).map((v) => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div>
                            <p className="mb-2 text-sm font-semibold">Observações</p>
                            <Textarea
                                value={editingCfg.notes}
                                onChange={(e) => updateConfig('notes', e.target.value)}
                                placeholder="Instruções específicas para este exercício..."
                                rows={3}
                                className="text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 border-t border-border p-4">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingIndex(null)}>
                            Cancelar
                        </Button>
                        <Button className="flex-1 bg-teal-600 text-white hover:bg-teal-700" onClick={() => setEditingIndex(null)}>
                            Aplicar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Exercise row for step 2
function ExerciseRow({
    cfg, index, isEditing, isDragging, isDragOver,
    onEdit, onRemove, onDuplicate,
    onDragStart, onDragOver, onDrop,
}: {
    cfg: ExerciseConfig;
    index: number;
    isEditing: boolean;
    isDragging: boolean;
    isDragOver: boolean;
    onEdit: () => void;
    onRemove: () => void;
    onDuplicate: () => void;
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
}) {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragEnd={() => {}}
            className={cn(
                'flex items-center gap-3 px-4 py-3 transition-colors',
                isDragging && 'opacity-50',
                isDragOver && 'bg-teal-50 dark:bg-teal-950',
                isEditing && 'bg-accent',
            )}
        >
            <GripVertical className="h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing" />
            <ExerciseThumb exercise={cfg.exercise} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{cfg.exercise.name}</p>
                <p className="text-xs text-muted-foreground">{getExerciseSpecs(cfg)}</p>
            </div>
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onEdit}
                    title="Editar exercício"
                    className={cn(
                        'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors',
                        isEditing
                            ? 'bg-teal-600 text-white'
                            : 'bg-teal-600/10 text-teal-600 hover:bg-teal-600 hover:text-white',
                    )}
                >
                    <Settings2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={onDuplicate}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
                >
                    <Copy className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// ─── Step 4: Detalhes do Programa ─────────────────────────────────────────────

interface Step4Props {
    patients: Patient[];
    configs: ExerciseConfig[];
    onBack: () => void;
    onSubmit: (data: Step4Data) => void;
    processing: boolean;
}

interface Step4Data {
    title: string;
    patient_id: string;
    start_date: string;
    end_date: string;
    message: string;
}

function Step4({ patients, configs, onBack, onSubmit, processing }: Step4Props) {
    const [data, setData] = useState<Step4Data>({
        title: '',
        patient_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        message: '',
    });

    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientList, setShowPatientList] = useState(false);
    const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()));
    const selectedPatient = patients.find((p) => String(p.id) === data.patient_id);

    const formatDate = (d: string) => {
        if (!d) return '';
        const [y, m, day] = d.split('-');
        return `${day}/${m}/${y}`;
    };

    const thumbnails = configs.slice(0, 4).map((c) => getExerciseThumbnail(c.exercise));
    const extra = configs.length - 4;

    return (
        <div className="flex h-full">
            {/* Left: form */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                    </button>
                    <h1 className="text-lg font-semibold">Detalhes do programa</h1>
                </div>

                <div className="max-w-xl flex-1 space-y-4 overflow-y-auto p-6">
                    {/* Título */}
                    <div>
                        <Input
                            placeholder="Título do programa"
                            value={data.title}
                            onChange={(e) => setData((d) => ({ ...d, title: e.target.value }))}
                            className="text-base"
                        />
                    </div>

                    {/* Paciente */}
                    <div className="relative">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Enviar para..."
                                    value={selectedPatient ? selectedPatient.name : patientSearch}
                                    onChange={(e) => {
                                        setPatientSearch(e.target.value);
                                        setData((d) => ({ ...d, patient_id: '' }));
                                        setShowPatientList(true);
                                    }}
                                    onFocus={() => setShowPatientList(true)}
                                    className="pl-9"
                                />
                                {showPatientList && filteredPatients.length > 0 && !selectedPatient && (
                                    <div className="absolute top-full z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
                                        {filteredPatients.slice(0, 8).map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                                                onClick={() => {
                                                    setData((d) => ({ ...d, patient_id: String(p.id) }));
                                                    setPatientSearch('');
                                                    setShowPatientList(false);
                                                }}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedPatient && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData((d) => ({ ...d, patient_id: '' }));
                                        setPatientSearch('');
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs text-muted-foreground">Início</label>
                            <Input
                                type="date"
                                value={data.start_date}
                                onChange={(e) => setData((d) => ({ ...d, start_date: e.target.value }))}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="mb-1 block text-xs text-muted-foreground">Término</label>
                            <Input
                                type="date"
                                value={data.end_date}
                                onChange={(e) => setData((d) => ({ ...d, end_date: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Mensagem */}
                    <div>
                        <button type="button" className="mb-2 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
                            <Plus className="h-3.5 w-3.5" />
                            Criar modelo de mensagem
                        </button>
                        <Textarea
                            placeholder="Mensagem"
                            value={data.message}
                            onChange={(e) => setData((d) => ({ ...d, message: e.target.value }))}
                            rows={4}
                            maxLength={600}
                        />
                        <p className="mt-1 text-right text-xs text-muted-foreground">{600 - data.message.length} caracteres restantes</p>
                    </div>
                </div>
            </div>

            {/* Right: summary */}
            <div className="flex w-72 flex-shrink-0 flex-col border-l border-border">
                <div className="border-b border-border p-4">
                    <h2 className="font-semibold">Resumo do programa</h2>
                </div>
                <div className="flex-1 space-y-4 p-4">
                    {/* Thumbnails */}
                    <div className="flex items-center gap-1">
                        {thumbnails.map((t, i) => (
                            <div
                                key={i}
                                className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-teal-600"
                                style={{ marginLeft: i > 0 ? '-8px' : '0' }}
                            >
                                {t ? (
                                    <img src={t} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                        <Dumbbell className="h-4 w-4 text-white/60" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {extra > 0 && (
                            <div
                                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium"
                                style={{ marginLeft: '-8px' }}
                            >
                                +{extra}
                            </div>
                        )}
                        <span className="ml-3 text-sm font-medium">{configs.length} exercícios</span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Duração</span>
                            <span>0 min</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Acesso disponível por</span>
                            <span>--</span>
                        </div>
                        {selectedPatient && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Paciente</span>
                                <span className="font-medium">{selectedPatient.name}</span>
                            </div>
                        )}
                        {data.start_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Início</span>
                                <span>{formatDate(data.start_date)}</span>
                            </div>
                        )}
                        {data.end_date && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Término</span>
                                <span>{formatDate(data.end_date)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="border-t border-border p-4">
                    <Button
                        className="w-full bg-teal-600 text-white hover:bg-teal-700"
                        disabled={!data.title || processing}
                        onClick={() => onSubmit(data)}
                    >
                        {processing && <Spinner className="mr-2" />}
                        Salvar e enviar programa
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Create({ patients, physioAreas, physioSubareas, periods }: CreateProps) {
    const [step, setStep] = useState<1 | 2 | 4>(1);
    const [configs, setConfigs] = useState<ExerciseConfig[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [processing, setProcessing] = useState(false);

    const handleSelect = useCallback((exercise: Exercise) => {
        setConfigs((prev) => [
            ...prev,
            {
                exercise_id: exercise.id,
                exercise,
                group_index: null,
                days_of_week: [],
                all_days: false,
                period: '',
                sets_min: exercise.sets ? String(exercise.sets) : '',
                sets_max: exercise.sets ? String(exercise.sets) : '',
                repetitions_min: exercise.repetitions ? String(exercise.repetitions) : '',
                repetitions_max: exercise.repetitions ? String(exercise.repetitions) : '',
                load_min: '',
                load_max: '',
                rest_time: exercise.rest_time ? String(exercise.rest_time) : '',
                notes: '',
                sort_order: prev.length,
            },
        ]);
    }, []);

    const handleRemove = useCallback((exerciseId: number) => {
        setConfigs((prev) => prev.filter((c) => c.exercise_id !== exerciseId).map((c, i) => ({ ...c, sort_order: i })));
    }, []);

    const handleSubmit = useCallback(
        (details: Step4Data) => {
            setProcessing(true);
            const payload = {
                title: details.title,
                patient_id: details.patient_id || null,
                start_date: details.start_date || null,
                end_date: details.end_date || null,
                message: details.message || null,
                status: details.patient_id ? 'active' : 'draft',
                groups: groups.map((g, i) => ({ name: g.name, sort_order: i })),
                exercises: configs.map((c, i) => ({
                    exercise_id: c.exercise_id,
                    treatment_plan_group_id: null,
                    days_of_week: c.days_of_week.length > 0 ? c.days_of_week : null,
                    period: c.period || null,
                    sets_min: c.sets_min ? Number(c.sets_min) : null,
                    sets_max: c.sets_max ? Number(c.sets_max) : null,
                    repetitions_min: c.repetitions_min ? Number(c.repetitions_min) : null,
                    repetitions_max: c.repetitions_max ? Number(c.repetitions_max) : null,
                    load_min: c.load_min ? Number(c.load_min) : null,
                    load_max: c.load_max ? Number(c.load_max) : null,
                    rest_time: c.rest_time || null,
                    notes: c.notes || null,
                    sort_order: i,
                })),
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.post('/clinic/treatment-plans', payload as any, {
                onFinish: () => setProcessing(false),
            });
        },
        [configs, groups],
    );

    return (
        <ClinicLayout>
            <Head title="Novo Programa" />
            <div className="flex h-full flex-col overflow-hidden">
                {step === 1 && (
                    <Step1
                        physioAreas={physioAreas}
                        selected={configs}
                        onSelect={handleSelect}
                        onRemove={handleRemove}
                        onAdvance={() => setStep(2)}
                    />
                )}
                {step === 2 && (
                    <Step2
                        configs={configs}
                        groups={groups}
                        onUpdateConfigs={setConfigs}
                        onUpdateGroups={setGroups}
                        onBack={() => setStep(1)}
                        onAdvance={() => setStep(4)}
                    />
                )}
                {step === 4 && (
                    <Step4
                        patients={patients}
                        configs={configs}
                        onBack={() => setStep(2)}
                        onSubmit={handleSubmit}
                        processing={processing}
                    />
                )}
            </div>
        </ClinicLayout>
    );
}
