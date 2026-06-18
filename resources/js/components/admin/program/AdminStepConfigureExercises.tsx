import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
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
    Copy,
    GripVertical,
    Pause,
    Pencil,
    Play,
    Settings2,
    Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { AdminWizardExercise, AdminWizardGroup } from './types';

interface AdminStepConfigureExercisesProps {
    groups: AdminWizardGroup[];
    onUpdateGroups: (groups: AdminWizardGroup[]) => void;
    onEditExercise: (groupId: number, exerciseId: number) => void;
    onNext: () => void;
    onBack: () => void;
}

export function AdminStepConfigureExercises({
    groups,
    onUpdateGroups,
    onEditExercise,
    onNext,
    onBack,
}: AdminStepConfigureExercisesProps) {
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(
        new Set(),
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const totalExercises = groups.reduce(
        (sum, g) => sum + g.exercises.length,
        0,
    );
    const configuredCount = groups.reduce(
        (sum, g) => sum + g.exercises.filter((e) => e.isConfigured).length,
        0,
    );

    const toggleGroup = (groupId: number) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const removeExercise = (groupId: number, exerciseId: number) => {
        onUpdateGroups(
            groups
                .map((g) =>
                    g.id === groupId
                        ? {
                              ...g,
                              exercises: g.exercises.filter(
                                  (e) => e.id !== exerciseId,
                              ),
                          }
                        : g,
                )
                .filter((g) => g.exercises.length > 0),
        );
    };

    const duplicateExercise = (groupId: number, exerciseId: number) => {
        onUpdateGroups(
            groups.map((g) => {
                if (g.id !== groupId) return g;
                const idx = g.exercises.findIndex((e) => e.id === exerciseId);
                if (idx === -1) return g;
                const original = g.exercises[idx];
                const clone: AdminWizardExercise = {
                    ...original,
                    id: -Date.now(),
                    isConfigured: false,
                };
                const newExercises = [...g.exercises];
                newExercises.splice(idx + 1, 0, clone);
                return { ...g, exercises: newExercises };
            }),
        );
    };

    const renameGroup = (groupId: number, name: string) => {
        onUpdateGroups(
            groups.map((g) => (g.id === groupId ? { ...g, name } : g)),
        );
    };

    const handleDragEnd = (groupId: number) => (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        onUpdateGroups(
            groups.map((g) => {
                if (g.id !== groupId) return g;
                const oldIndex = g.exercises.findIndex(
                    (e) => e.id === active.id,
                );
                const newIndex = g.exercises.findIndex((e) => e.id === over.id);
                return {
                    ...g,
                    exercises: arrayMove(g.exercises, oldIndex, newIndex),
                };
            }),
        );
    };

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col">
            {/* Header with progress */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                        {configuredCount} de {totalExercises} editados
                    </span>
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                                width: `${totalExercises ? (configuredCount / totalExercises) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onBack}>
                        Voltar
                    </Button>
                    <Button size="sm" onClick={onNext}>
                        Avançar
                    </Button>
                </div>
            </div>

            {/* Groups */}
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    {groups.map((group) => {
                        const isCollapsed = collapsedGroups.has(group.id);
                        return (
                            <div key={group.id} className="space-y-2">
                                {/* Group header */}
                                <div className="flex items-center gap-2">
                                    <EditableGroupName
                                        name={group.name}
                                        onRename={(n) =>
                                            renameGroup(group.id, n)
                                        }
                                    />
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {group.exercises.length}
                                    </Badge>
                                    <div className="flex-1" />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => toggleGroup(group.id)}
                                    >
                                        {isCollapsed ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronUp className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {/* Exercises with drag and drop */}
                                {!isCollapsed && (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd(group.id)}
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
                                                            key={exercise.id}
                                                            exercise={exercise}
                                                            groupId={group.id}
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
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>
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
    exercise: AdminWizardExercise;
    groupId: number;
    onEdit: (groupId: number, exerciseId: number) => void;
    onRemove: (groupId: number, exerciseId: number) => void;
    onDuplicate: (groupId: number, exerciseId: number) => void;
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

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        if (isPlaying) {
            v.pause();
            setIsPlaying(false);
        } else {
            v.play();
            setIsPlaying(true);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-shadow',
                isDragging && 'relative z-50 opacity-90 shadow-lg',
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
            <div className="group relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                <video
                    ref={videoRef}
                    src={exercise.videoUrl ?? undefined}
                    poster={exercise.thumbnailUrl ?? undefined}
                    className="h-full w-full object-cover"
                    onEnded={() => setIsPlaying(false)}
                    controlsList="nodownload"
                    playsInline
                />
                <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {!isPlaying && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/30 bg-background/80 shadow-lg backdrop-blur-md transition-transform duration-200 group-hover:scale-110">
                            <Play className="ml-0.5 h-4 w-4 text-foreground" />
                        </div>
                    )}
                </button>
                {isPlaying && (
                    <button
                        onClick={togglePlay}
                        className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 hover:opacity-100"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/30 bg-background/80 shadow-lg backdrop-blur-md">
                            <Pause className="h-4 w-4 text-foreground" />
                        </div>
                    </button>
                )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">
                    {exercise.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {exercise.isConfigured
                        ? 'Configurado'
                        : 'Sem especificações'}
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 items-center gap-1">
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
