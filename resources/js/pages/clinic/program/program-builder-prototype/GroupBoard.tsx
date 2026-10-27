/**
 * PROTÓTIPO (descartável): os grupos do programa (StepConfigureExercises da
 * v1 no DS). Arrastar reordena e troca de grupo (dnd-kit, como na v1);
 * cada linha mostra a dose em pedaços ou "Sem dose" em destaque. De novo:
 * nomes prontos para grupo novo e o "adicionar neste grupo" que volta à
 * biblioteca já mirando o grupo.
 */
import {
    closestCorners,
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragOverEvent,
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
    CircleAlert,
    Copy,
    GripVertical,
    Pencil,
    Plus,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { DsButton, dsCn, DsInput } from '@/components/ds';
import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';
import { CardVideo } from '@/pages/clinic/program/exercise-library-prototype/media';

import { doseParts, scheduleOf, type ProgramBuilder } from './builder';

const GROUP_NAMES = [
    'Aquecimento',
    'Principal',
    'Alongamento',
    'Desaquecimento',
];

// ---------------------------------------------------------------- linha

function DoseSummary({ exercise }: { exercise: ProgramExercise }) {
    const parts = doseParts(exercise);
    if (!exercise.isConfigured || parts.length === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-ds-caption font-medium text-ds-status-warning-content [&_svg]:size-3.5">
                <CircleAlert />
                Sem dose
            </span>
        );
    }
    return (
        <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-ds-caption">
            {parts.map((p) => (
                <span key={p.key} className="whitespace-nowrap">
                    <span className="font-semibold text-ds-content-primary">
                        {p.value}
                    </span>{' '}
                    <span className="text-ds-content-secondary">{p.unit}</span>
                </span>
            ))}
        </span>
    );
}

function Row({
    exercise,
    onDose,
    onDuplicate,
    onRemove,
    dragHandle,
    dragging,
}: {
    exercise: ProgramExercise;
    onDose?: () => void;
    onDuplicate?: () => void;
    onRemove?: () => void;
    dragHandle?: ReactNode;
    dragging?: boolean;
}) {
    const schedule = scheduleOf(exercise);
    return (
        <div
            className={dsCn(
                'flex items-center gap-2 rounded-ds-lg bg-ds-surface-default py-2 pr-2 sm:gap-3',
                dragging && 'shadow-ds-md ring-1 ring-ds-primary-40',
            )}
        >
            {dragHandle}
            <CardVideo
                exercise={exercise}
                className="size-14 shrink-0 rounded-ds-md sm:size-16"
            />
            <button
                type="button"
                onClick={onDose}
                className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 text-left outline-0 focus-visible:rounded-ds-md focus-visible:shadow-ds-focus"
            >
                <span className="line-clamp-2 text-ds-body-xs font-medium text-ds-content-primary sm:text-ds-body-sm">
                    {exercise.title}
                </span>
                <DoseSummary exercise={exercise} />
                {schedule && (
                    <span className="text-ds-caption text-ds-content-muted">
                        {schedule}
                    </span>
                )}
            </button>
            {onDose && (
                <div className="max-sm:hidden">
                    <DsButton
                        variant={
                            exercise.isConfigured ? 'tertiary' : 'secondary'
                        }
                        size="sm"
                        iconPosition="left"
                        icon={<SlidersHorizontal />}
                        label={
                            exercise.isConfigured
                                ? 'Editar dose'
                                : 'Definir dose'
                        }
                        onClick={onDose}
                    />
                </div>
            )}
            {onDuplicate && (
                <DsButton
                    variant="tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<Copy />}
                    label={`Duplicar ${exercise.title}`}
                    tooltip="Duplicar"
                    onClick={onDuplicate}
                />
            )}
            {onRemove && (
                <DsButton
                    variant="destructive-tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<Trash2 />}
                    label={`Tirar ${exercise.title}`}
                    tooltip="Tirar do programa"
                    onClick={onRemove}
                />
            )}
        </div>
    );
}

function SortableRow(props: Parameters<typeof Row>[0]) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.exercise.id });
    return (
        <li
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
            }}
            className={dsCn(isDragging && 'opacity-40')}
        >
            <Row
                {...props}
                dragHandle={
                    <button
                        type="button"
                        aria-label={`Arrastar ${props.exercise.title}`}
                        className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-ds-content-subtle outline-0 hover:text-ds-content-secondary focus-visible:shadow-ds-focus active:cursor-grabbing [&_svg]:size-4"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical />
                    </button>
                }
            />
        </li>
    );
}

// ---------------------------------------------------------------- grupo

function GroupName({
    name,
    onRename,
}: {
    name: string;
    onRename: (name: string) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(name);
    if (editing) {
        const done = () => {
            onRename(draft.trim() || name);
            setEditing(false);
        };
        return (
            <div className="w-full max-w-64">
                <DsInput
                    size="sm"
                    aria-label="Nome do grupo"
                    autoFocus
                    value={draft}
                    onValueChange={setDraft}
                    onBlur={done}
                    onEnterPressed={done}
                />
            </div>
        );
    }
    return (
        <button
            type="button"
            onClick={() => {
                setDraft(name);
                setEditing(true);
            }}
            className="group/name flex min-w-0 cursor-pointer items-center gap-1.5 rounded-ds-sm text-left outline-0 focus-visible:shadow-ds-focus"
        >
            <span className="truncate text-ds-body-sm font-semibold text-ds-content-primary">
                {name || 'Sem nome'}
            </span>
            <Pencil className="size-3.5 shrink-0 text-ds-content-subtle group-hover/name:text-ds-content-secondary" />
        </button>
    );
}

function GroupCard({
    group,
    builder,
    onDose,
    onAddExercises,
}: {
    group: ProgramGroup;
    builder: ProgramBuilder;
    onDose: (groupId: string, exerciseId: string) => void;
    onAddExercises: (groupId: string) => void;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const { setNodeRef, isOver } = useDroppable({ id: group.id });
    const withDose = group.exercises.filter((e) => e.isConfigured).length;
    return (
        <section
            aria-label={group.name}
            className={dsCn(
                'rounded-ds-xl border bg-ds-surface-default shadow-ds-xs transition-colors',
                isOver
                    ? 'border-ds-primary-60 bg-ds-surface-brand-subtle'
                    : 'border-ds-border-subtle',
            )}
        >
            <header className="flex items-center gap-2 border-b border-ds-border-subtle px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <GroupName
                        name={group.name}
                        onRename={(n) => builder.renameGroup(group.id, n)}
                    />
                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                        {withDose}/{group.exercises.length} com dose
                    </span>
                </div>
                <DsButton
                    variant="tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<Copy />}
                    label={`Duplicar grupo ${group.name}`}
                    tooltip="Duplicar grupo"
                    onClick={() => builder.duplicateGroup(group.id)}
                />
                <DsButton
                    variant="destructive-tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<Trash2 />}
                    label={`Excluir grupo ${group.name}`}
                    tooltip="Excluir grupo"
                    onClick={() => builder.removeGroup(group.id)}
                />
                <DsButton
                    variant="tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={
                        <ChevronDown
                            className={dsCn(
                                'transition-transform',
                                collapsed && '-rotate-90',
                            )}
                        />
                    }
                    label={collapsed ? 'Abrir grupo' : 'Recolher grupo'}
                    onClick={() => setCollapsed((c) => !c)}
                />
            </header>
            {!collapsed && (
                <div ref={setNodeRef} className="px-1 py-1 sm:px-2">
                    <SortableContext
                        items={group.exercises.map((e) => e.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className="flex flex-col divide-y divide-ds-border-subtle">
                            {group.exercises.map((e) => (
                                <SortableRow
                                    key={e.id}
                                    exercise={e}
                                    onDose={() => onDose(group.id, e.id)}
                                    onDuplicate={() =>
                                        builder.duplicateExercise(
                                            group.id,
                                            e.id,
                                        )
                                    }
                                    onRemove={() =>
                                        builder.removeExercise(group.id, e.id)
                                    }
                                />
                            ))}
                        </ul>
                    </SortableContext>
                    <button
                        type="button"
                        onClick={() => onAddExercises(group.id)}
                        className={dsCn(
                            'my-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-ds-lg border border-dashed py-3 text-ds-caption font-medium outline-0 transition-colors focus-visible:shadow-ds-focus [&_svg]:size-4',
                            'border-ds-border-default text-ds-content-muted hover:border-ds-primary-40 hover:text-ds-content-brand',
                        )}
                    >
                        <Plus />
                        {group.exercises.length === 0
                            ? 'Grupo vazio: adicionar exercícios aqui'
                            : 'Adicionar exercícios neste grupo'}
                    </button>
                </div>
            )}
        </section>
    );
}

// ---------------------------------------------------------------- quadro

export function GroupBoard({
    builder,
    onDose,
    onAddExercises,
}: {
    builder: ProgramBuilder;
    onDose: (groupId: string, exerciseId: string) => void;
    onAddExercises: (groupId: string) => void;
}) {
    const { groups, setGroups } = builder;
    const [activeId, setActiveId] = useState<string | null>(null);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );
    const groupOf = (id: string) =>
        groups.find((g) => g.id === id) ??
        groups.find((g) => g.exercises.some((e) => e.id === id));

    // Trocar de grupo durante o arraste (mesma regra da v1).
    const onDragOver = ({ active, over }: DragOverEvent) => {
        if (!over) return;
        const src = groupOf(String(active.id));
        const dest = groupOf(String(over.id));
        if (!src || !dest || src.id === dest.id) return;
        const moving = src.exercises.find((e) => e.id === active.id);
        if (!moving) return;
        const overIdx = dest.exercises.findIndex((e) => e.id === over.id);
        setGroups((prev) =>
            prev.map((g) => {
                if (g.id === src.id) {
                    return {
                        ...g,
                        exercises: g.exercises.filter(
                            (e) => e.id !== active.id,
                        ),
                    };
                }
                if (g.id === dest.id) {
                    const list = [...g.exercises];
                    list.splice(
                        overIdx >= 0 ? overIdx : list.length,
                        0,
                        moving,
                    );
                    return { ...g, exercises: list };
                }
                return g;
            }),
        );
    };

    // Reordenar dentro do grupo.
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setActiveId(null);
        if (!over || active.id === over.id) return;
        const g = groupOf(String(active.id));
        if (!g || !g.exercises.some((e) => e.id === over.id)) return;
        const from = g.exercises.findIndex((e) => e.id === active.id);
        const to = g.exercises.findIndex((e) => e.id === over.id);
        setGroups((prev) =>
            prev.map((x) =>
                x.id === g.id
                    ? { ...x, exercises: arrayMove(x.exercises, from, to) }
                    : x,
            ),
        );
    };

    const active = activeId
        ? groups.flatMap((g) => g.exercises).find((e) => e.id === activeId)
        : null;

    return (
        <div className="flex flex-col gap-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={({ active: a }) => setActiveId(String(a.id))}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDragCancel={() => setActiveId(null)}
            >
                {groups.map((g) => (
                    <GroupCard
                        key={g.id}
                        group={g}
                        builder={builder}
                        onDose={onDose}
                        onAddExercises={onAddExercises}
                    />
                ))}
                <DragOverlay>
                    {active && <Row exercise={active} dragging />}
                </DragOverlay>
            </DndContext>

            {/* Grupo novo, já com nomes comuns à mão. */}
            <div className="flex flex-col gap-2 rounded-ds-xl border border-dashed border-ds-border-default p-3 sm:flex-row sm:items-center sm:gap-3">
                <DsButton
                    variant="secondary"
                    size="sm"
                    iconPosition="left"
                    icon={<Plus />}
                    label="Novo grupo"
                    onClick={() => builder.addGroup()}
                />
                <div className="flex flex-wrap gap-1.5">
                    {GROUP_NAMES.filter(
                        (n) => !groups.some((g) => g.name === n),
                    ).map((n) => (
                        <button
                            key={n}
                            type="button"
                            onClick={() => builder.addGroup(n)}
                            className="h-7 cursor-pointer rounded-ds-full border border-ds-border-subtle bg-ds-surface-default px-2.5 text-ds-caption text-ds-content-secondary outline-0 hover:border-ds-primary-40 hover:text-ds-content-brand focus-visible:shadow-ds-focus"
                        >
                            + {n}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
