import {
    closestCorners,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ChevronDown,
    ChevronUp,
    CirclePlus,
    Copy,
    GripVertical,
    List,
    Pencil,
    Settings2,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { VideoThumb } from '@/components/VideoThumb';
import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface StepConfigureExercisesProps {
    groups: ProgramGroup[];
    onUpdateGroups: (groups: ProgramGroup[]) => void;
    onEditExercise: (groupId: string, exerciseId: string) => void;
    onBack: () => void;
}

export function StepConfigureExercises({
    groups,
    onUpdateGroups,
    onEditExercise,
    onBack,
}: StepConfigureExercisesProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
        new Set(),
    );
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const toggleGroup = (groupId: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const addGroup = () => {
        onUpdateGroups([
            ...groups,
            { id: `group-${Date.now()}`, name: 'Novo grupo', exercises: [] },
        ]);
    };

    const duplicateGroup = (groupId: string) => {
        const group = groups.find((g) => g.id === groupId);
        if (!group) return;
        const now = Date.now();
        const cloned: ProgramGroup = {
            id: `group-${now}`,
            name: `${group.name} (Cópia)`,
            exercises: group.exercises.map((e, i) => ({
                ...e,
                id: `${e.id}-copy-${now}-${i}`,
            })),
        };
        const idx = groups.findIndex((g) => g.id === groupId);
        const next = [...groups];
        next.splice(idx + 1, 0, cloned);
        onUpdateGroups(next);
    };

    const deleteGroup = (groupId: string) => {
        onUpdateGroups(groups.filter((g) => g.id !== groupId));
    };

    const removeExercise = (groupId: string, exerciseId: string) => {
        onUpdateGroups(
            groups.map((g) =>
                g.id === groupId
                    ? {
                          ...g,
                          exercises: g.exercises.filter(
                              (e) => e.id !== exerciseId,
                          ),
                      }
                    : g,
            ),
        );
    };

    const duplicateExercise = (groupId: string, exerciseId: string) => {
        onUpdateGroups(
            groups.map((g) => {
                if (g.id !== groupId) return g;
                const idx = g.exercises.findIndex((e) => e.id === exerciseId);
                if (idx === -1) return g;
                const original = g.exercises[idx];
                const clone: ProgramExercise = {
                    ...original,
                    id: `${original.id}-copy-${Date.now()}`,
                    isConfigured: false,
                };
                const newExercises = [...g.exercises];
                newExercises.splice(idx + 1, 0, clone);
                return { ...g, exercises: newExercises };
            }),
        );
    };

    const renameGroup = (groupId: string, name: string) => {
        onUpdateGroups(
            groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
        );
    };

    /* ── Cross-group drag handlers ── */

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const srcId = active.id as string;
        const overId = over.id as string;

        const srcGroup = groups.find((g) =>
            g.exercises.some((e) => e.id === srcId),
        );
        if (!srcGroup) return;

        let destGroup = groups.find((g) => g.id === overId);
        let overIdx = -1;

        if (!destGroup) {
            destGroup = groups.find((g) =>
                g.exercises.some((e) => e.id === overId),
            );
            if (destGroup)
                overIdx = destGroup.exercises.findIndex((e) => e.id === overId);
        }

        if (!destGroup || srcGroup.id === destGroup.id) return;

        const exercise = srcGroup.exercises.find((e) => e.id === srcId);
        if (!exercise) return;

        onUpdateGroups(
            groups.map((g) => {
                if (g.id === srcGroup.id) {
                    return {
                        ...g,
                        exercises: g.exercises.filter((e) => e.id !== srcId),
                    };
                }
                if (g.id === destGroup!.id) {
                    const exs = [...g.exercises];
                    if (overIdx >= 0) exs.splice(overIdx, 0, exercise);
                    else exs.push(exercise);
                    return { ...g, exercises: exs };
                }
                return g;
            }),
        );
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || active.id === over.id) return;

        const aId = active.id as string;
        const oId = over.id as string;

        const aGroup = groups.find((g) =>
            g.exercises.some((e) => e.id === aId),
        );
        const oGroup = groups.find((g) =>
            g.exercises.some((e) => e.id === oId),
        );

        if (aGroup && oGroup && aGroup.id === oGroup.id) {
            const oldIdx = aGroup.exercises.findIndex((e) => e.id === aId);
            const newIdx = aGroup.exercises.findIndex((e) => e.id === oId);
            if (oldIdx !== newIdx) {
                onUpdateGroups(
                    groups.map((g) =>
                        g.id === aGroup.id
                            ? {
                                  ...g,
                                  exercises: arrayMove(
                                      g.exercises,
                                      oldIdx,
                                      newIdx,
                                  ),
                              }
                            : g,
                    ),
                );
            }
        }
    };

    const activeExercise = activeId
        ? groups.flatMap((g) => g.exercises).find((e) => e.id === activeId)
        : null;

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            {/* Groups */}
            <ScrollArea className="flex-1">
                <div className="p-4 sm:p-6">
                    {/* Add new group */}
                    <button
                        onClick={addGroup}
                        className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                    >
                        <List className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            Adicionar novo grupo
                        </span>
                    </button>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-6">
                            {groups.map((group) => {
                                const isCollapsed = collapsedGroups.has(
                                    group.id,
                                );
                                return (
                                    <div key={group.id} className="space-y-2">
                                        {/* Group header */}
                                        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                                            <div className="min-w-0 truncate">
                                                <EditableGroupName
                                                    name={group.name}
                                                    onRename={(n) =>
                                                        renameGroup(group.id, n)
                                                    }
                                                />
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="shrink-0 text-xs"
                                            >
                                                {group.exercises.length}
                                            </Badge>
                                            <div className="flex-1" />
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 shrink-0 cursor-pointer"
                                                        onClick={() =>
                                                            duplicateGroup(
                                                                group.id,
                                                            )
                                                        }
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    Duplicar grupo
                                                </TooltipContent>
                                            </Tooltip>
                                            {groups.length > 1 && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0 cursor-pointer text-muted-foreground hover:text-destructive"
                                                            onClick={() =>
                                                                deleteGroup(
                                                                    group.id,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        Excluir grupo
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0 cursor-pointer"
                                                onClick={() =>
                                                    toggleGroup(group.id)
                                                }
                                            >
                                                {isCollapsed ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronUp className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        {/* Exercises */}
                                        {!isCollapsed && (
                                            <DroppableGroupContainer
                                                id={group.id}
                                            >
                                                <SortableContext
                                                    items={group.exercises.map(
                                                        (e) => e.id,
                                                    )}
                                                    strategy={
                                                        verticalListSortingStrategy
                                                    }
                                                >
                                                    <div className="space-y-3">
                                                        {group.exercises.map(
                                                            (exercise) => (
                                                                <SortableExerciseRow
                                                                    key={
                                                                        exercise.id
                                                                    }
                                                                    exercise={
                                                                        exercise
                                                                    }
                                                                    groupId={
                                                                        group.id
                                                                    }
                                                                    onEdit={
                                                                        onEditExercise
                                                                    }
                                                                    onRemove={
                                                                        removeExercise
                                                                    }
                                                                    onDuplicate={
                                                                        duplicateExercise
                                                                    }
                                                                />
                                                            ),
                                                        )}
                                                        {group.exercises
                                                            .length === 0 && (
                                                            <div className="flex items-center justify-center rounded-lg border-2 border-dashed py-8 text-sm text-muted-foreground">
                                                                Arraste
                                                                exercícios para
                                                                este grupo
                                                            </div>
                                                        )}
                                                    </div>
                                                </SortableContext>
                                            </DroppableGroupContainer>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <DragOverlay dropAnimation={null}>
                            {activeExercise && (
                                <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 opacity-90 shadow-lg">
                                    <GripVertical className="h-5 w-5 text-muted-foreground/50" />
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                        <img
                                            src={activeExercise.thumbnailUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-foreground">
                                            {activeExercise.title}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatFrequency(activeExercise)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>

                    {/* Add more exercises */}
                    <button
                        onClick={onBack}
                        className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed py-4 text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
                    >
                        <CirclePlus className="h-5 w-5" />
                        <span className="text-sm font-medium">
                            Adicionar exercícios
                        </span>
                    </button>
                </div>
            </ScrollArea>
        </div>
    );
}

/* ── Helpers ── */

function formatFrequency(ex: ProgramExercise): string {
    if (!ex.isConfigured) return 'Sem especificações';
    const parts: string[] = [];

    const sets =
        ex.seriesMin != null &&
        ex.seriesMax != null &&
        ex.seriesMin !== ex.seriesMax
            ? `${ex.seriesMin}-${ex.seriesMax} séries`
            : ex.seriesMin != null
              ? `${ex.seriesMin} séries`
              : null;
    if (sets) parts.push(sets);

    const reps =
        ex.repetitionsMin != null &&
        ex.repetitionsMax != null &&
        ex.repetitionsMin !== ex.repetitionsMax
            ? `${ex.repetitionsMin}-${ex.repetitionsMax} repetições`
            : ex.repetitionsMin != null
              ? `${ex.repetitionsMin} repetições`
              : null;
    if (reps) parts.push(reps);

    if (ex.restTime != null) parts.push(`descansar por ${ex.restTime} seg`);

    if (parts.length === 0) return 'Configurado';

    return `Frequência: ${parts.join(', ')}`;
}

function DroppableGroupContainer({
    id,
    children,
}: {
    id: string;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-h-[48px] rounded-lg p-1 transition-colors',
                isOver && 'bg-accent/40',
            )}
        >
            {children}
        </div>
    );
}

function SortableExerciseRow({
    exercise,
    groupId,
    onEdit,
    onRemove,
    onDuplicate,
}: {
    exercise: ProgramExercise;
    groupId: string;
    onEdit: (groupId: string, exerciseId: string) => void;
    onRemove: (groupId: string, exerciseId: string) => void;
    onDuplicate: (groupId: string, exerciseId: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: exercise.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-2 rounded-lg border border-border bg-card p-3 transition-shadow sm:gap-4 sm:p-4',
                isDragging && 'relative z-50 opacity-30',
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="h-5 w-5 flex-shrink-0 cursor-grab text-muted-foreground/50 active:cursor-grabbing"
            >
                <GripVertical className="h-5 w-5" />
            </div>

            {/* Thumbnail with play */}
            <div className="group relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-20">
                <VideoThumb
                    videoUrl={exercise.videoUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-foreground">
                    {exercise.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground sm:mt-1">
                    {formatFrequency(exercise)}
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-0.5 sm:gap-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="default"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={() => onEdit(groupId, exercise.id)}
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Configurar</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-destructive"
                            onClick={() => onRemove(groupId, exercise.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remover</TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer text-muted-foreground"
                            onClick={() => onDuplicate(groupId, exercise.id)}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicar</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

function EditableGroupName({
    name,
    onRename,
}: {
    name: string;
    onRename: (n: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(name);

    if (editing) {
        return (
            <input
                autoFocus
                className="border-b border-primary bg-transparent px-1 text-sm font-semibold text-foreground outline-none"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={() => {
                    setEditing(false);
                    if (value.trim()) onRename(value.trim());
                    else setValue(name);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter')
                        (e.target as HTMLInputElement).blur();
                }}
            />
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="flex cursor-pointer items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
        >
            {name}
            <Pencil className="h-3 w-3" />
        </button>
    );
}
