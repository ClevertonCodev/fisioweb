/**
 * PROTÓTIPO C · Funções e acessos: a equipe toda junta de um lado e, do
 * outro, as funções do sistema, cada uma uma sanfona que abre o que ela
 * faz e o que não faz. Para mudar a função de alguém, arrasta a pessoa
 * para cima da função (ou usa "Mudar função"); antes de confirmar, o
 * modal mostra o que ela ganha e o que perde. O mestre não muda. Stub.
 */
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    ArrowRight,
    ChevronDown,
    Crown,
    GripVertical,
    Headset,
    Minus,
    Plus,
    ShieldCheck,
    Stethoscope,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { toast } from 'sonner';

import { DsButton, dsCn, DsDropdown, DsModal } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';

import { CAPABILITIES, ROLE_META, ROLES, type Member } from './data';
import {
    Avatar,
    CapabilityList,
    RoleBadge,
    SecuritySignals,
    StatusBadge,
} from './parts';
import type { VariantProps } from './UserListPrototype';

const ROLE_ICON: Record<ClinicRole, ReactNode> = {
    admin: <ShieldCheck />,
    physiotherapist: <Stethoscope />,
    secretary: <Headset />,
};

const ROLE_TONE: Record<ClinicRole, string> = {
    admin: 'bg-ds-primary-80 text-white ds-dark:bg-ds-primary-70',
    physiotherapist: 'bg-ds-success-80 text-white',
    secretary: 'bg-ds-warning-50 text-ds-warning-120',
};

interface Move {
    member: Member;
    to: ClinicRole;
}

/** O que muda ao trocar de função: linhas que ganham e que perdem. */
function diff(from: ClinicRole, to: ClinicRole) {
    return CAPABILITIES.map((c) => ({
        label: c.label,
        before: c.access[from],
        after: c.access[to],
    })).filter((c) => c.before !== c.after);
}

function access(v: true | false | string) {
    return v === true ? 'Sim' : v === false ? 'Não' : v;
}

// ---------------------------------------------------------------- pessoa

function Person({
    member: m,
    onOpen,
    onMove,
    overlay,
}: {
    member: Member;
    onOpen?: () => void;
    onMove?: (to: ClinicRole) => void;
    overlay?: boolean;
}) {
    const locked = m.mestre === 1;
    // A cópia que acompanha o arraste tem id próprio e não arrasta.
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: overlay ? `arrastando-${m.id}` : m.id,
        disabled: locked || overlay,
    });
    return (
        <li
            ref={overlay ? undefined : setNodeRef}
            className={dsCn(
                'flex min-w-0 flex-wrap items-center gap-2 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:flex-nowrap',
                isDragging && 'opacity-30',
                overlay && 'shadow-ds-md ring-2 ring-ds-primary-40',
                !m.active && 'opacity-70',
            )}
        >
            <button
                type="button"
                aria-label={
                    locked
                        ? `${m.name} é o mestre e não muda de função`
                        : `Arrastar ${m.name} para uma função`
                }
                disabled={locked}
                className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-ds-content-subtle outline-0 hover:text-ds-content-secondary focus-visible:shadow-ds-focus active:cursor-grabbing disabled:cursor-not-allowed max-sm:hidden [&_svg]:size-4"
                {...attributes}
                {...listeners}
            >
                {locked ? (
                    <Crown className="text-ds-warning-80" />
                ) : (
                    <GripVertical />
                )}
            </button>
            <button
                type="button"
                onClick={onOpen}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-0 focus-visible:rounded-ds-md focus-visible:shadow-ds-focus"
            >
                <Avatar member={m} size={44} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-ds-body-sm font-semibold text-ds-content-primary">
                        {m.name}
                    </span>
                    <span className="truncate text-ds-caption text-ds-content-muted">
                        {m.email}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={m.role} />
                        <StatusBadge active={m.active} />
                        <SecuritySignals member={m} compact />
                    </span>
                </span>
            </button>
            {/* Sem arrastar (celular): escolher a função, numa linha só dela. */}
            {onMove && !locked && (
                <div className="basis-full border-t border-ds-border-subtle pt-2 sm:hidden">
                    <DsDropdown
                        mode="radio"
                        label={`Mudar função de ${m.name}`}
                        menuAlign="right"
                        menuTitle="Mudar para"
                        fixedLabel="Mudar função"
                        items={ROLES.map((r) => ({
                            key: r,
                            label: ROLE_META[r].label,
                        }))}
                        value={m.role}
                        onValueChange={(r) => {
                            if (r !== m.role) onMove(r as ClinicRole);
                        }}
                    />
                </div>
            )}
        </li>
    );
}

// ---------------------------------------------------------------- função

/** Uma função do sistema: abre e fecha; aceita uma pessoa solta em cima. */
function RoleItem({
    role,
    count,
    open,
    onToggle,
    dragging,
}: {
    role: ClinicRole;
    count: number;
    open: boolean;
    onToggle: () => void;
    dragging: Member | null;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: role });
    const canDrop = dragging !== null && dragging.role !== role;
    const panelId = `funcao-${role}`;
    return (
        <li
            ref={setNodeRef}
            className={dsCn(
                'overflow-hidden rounded-ds-xl border bg-ds-surface-default transition-[border-color,box-shadow]',
                isOver && canDrop
                    ? 'border-ds-primary-60 shadow-ds-md ring-2 ring-ds-primary-40/40'
                    : canDrop
                      ? 'border-dashed border-ds-primary-40'
                      : 'border-ds-border-subtle',
            )}
        >
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={onToggle}
                className="flex w-full cursor-pointer items-center gap-3 p-3 text-left outline-0 hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus sm:p-4"
            >
                <span
                    className={dsCn(
                        'flex size-10 shrink-0 items-center justify-center rounded-ds-lg [&_svg]:size-5',
                        ROLE_TONE[role],
                    )}
                >
                    {ROLE_ICON[role]}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-ds-body-sm font-semibold text-ds-content-primary">
                        {ROLE_META[role].label}
                        <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                            {count} {count === 1 ? 'pessoa' : 'pessoas'}
                        </span>
                    </span>
                    <span className="block text-ds-caption text-ds-content-muted">
                        {isOver && canDrop
                            ? `Soltar aqui para mudar ${dragging?.name.split(' ')[0]}`
                            : ROLE_META[role].description}
                    </span>
                </span>
                <ChevronDown
                    className={dsCn(
                        'size-4 shrink-0 text-ds-content-muted transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open && (
                <div
                    id={panelId}
                    className="border-t border-ds-border-subtle px-4 pt-1 pb-3"
                >
                    <CapabilityList role={role} />
                </div>
            )}
        </li>
    );
}

// ---------------------------------------------------------------- variante

export function VariantC({
    members,
    isLoading,
    emptyState,
    onOpen,
}: VariantProps) {
    const [dragging, setDragging] = useState<Member | null>(null);
    const [move, setMove] = useState<Move | null>(null);
    const [shown, setShown] = useState<Move | null>(null);
    if (move && move !== shown) setShown(move);
    const [openRoles, setOpenRoles] = useState<ClinicRole[]>([]);
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    );

    const toggleRole = (r: ClinicRole) =>
        setOpenRoles((prev) =>
            prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r],
        );
    const onDragEnd = ({ active, over }: DragEndEvent) => {
        setDragging(null);
        const m = members.find((x) => x.id === active.id);
        const to = over?.id as ClinicRole | undefined;
        if (m && to && to !== m.role) setMove({ member: m, to });
    };
    const changes = shown ? diff(shown.member.role, shown.to) : [];

    return (
        <>
            <DndContext
                sensors={sensors}
                onDragStart={({ active }) =>
                    setDragging(members.find((m) => m.id === active.id) ?? null)
                }
                onDragEnd={onDragEnd}
                onDragCancel={() => setDragging(null)}
            >
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                    {/* Usuários: todos juntos. */}
                    <section
                        aria-label="Usuários"
                        className="flex flex-col gap-3"
                    >
                        <h2 className="flex items-center gap-2 text-ds-body-md font-semibold text-ds-content-primary">
                            Usuários
                            <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                                {members.length}
                            </span>
                        </h2>
                        {isLoading ? (
                            <div className="grid gap-3 xl:grid-cols-2">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-24 animate-pulse rounded-ds-lg bg-ds-surface-subtle"
                                    />
                                ))}
                            </div>
                        ) : (
                            (emptyState ?? (
                                <ul className="grid gap-3 xl:grid-cols-2">
                                    {members.map((m) => (
                                        <Person
                                            key={m.id}
                                            member={m}
                                            onOpen={() => onOpen(m)}
                                            onMove={(to) =>
                                                setMove({ member: m, to })
                                            }
                                        />
                                    ))}
                                </ul>
                            ))
                        )}
                    </section>

                    {/* Funções do sistema: sanfonas. */}
                    <aside
                        aria-label="Funções do sistema"
                        className="flex flex-col gap-3 lg:sticky lg:top-6"
                    >
                        <div>
                            <h2 className="text-ds-body-md font-semibold text-ds-content-primary">
                                Funções do sistema
                            </h2>
                            <p className="text-ds-caption text-ds-content-muted max-sm:hidden">
                                Abra para ver o que cada função faz. Arraste
                                alguém para cima de uma função para mudar.
                            </p>
                        </div>
                        <ul className="flex flex-col gap-2">
                            {ROLES.map((r) => (
                                <RoleItem
                                    key={r}
                                    role={r}
                                    count={
                                        members.filter((m) => m.role === r)
                                            .length
                                    }
                                    open={openRoles.includes(r)}
                                    onToggle={() => toggleRole(r)}
                                    dragging={dragging}
                                />
                            ))}
                        </ul>
                    </aside>
                </div>
                <DragOverlay>
                    {dragging && (
                        <ul className="w-80">
                            <Person member={dragging} overlay />
                        </ul>
                    )}
                </DragOverlay>
            </DndContext>

            <DsModal
                open={move !== null}
                onOpenChange={(o) => !o && setMove(null)}
                title="Mudar função"
                size="sm"
                footer={
                    <div className="flex w-full justify-end gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={() => setMove(null)}
                        />
                        <DsButton
                            label="Mudar função"
                            onClick={() => {
                                toast.info(
                                    `Protótipo: ${shown?.member.name} continua como ${shown ? ROLE_META[shown.member.role].label : ''}.`,
                                );
                                setMove(null);
                            }}
                        />
                    </div>
                }
            >
                {shown && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <Avatar member={shown.member} size={40} />
                            <p className="flex flex-wrap items-center gap-1.5 text-ds-body-sm text-ds-content-secondary [&_svg]:size-4">
                                <strong className="text-ds-content-primary">
                                    {shown.member.name}
                                </strong>
                                {ROLE_META[shown.member.role].label}
                                <ArrowRight />
                                <strong className="text-ds-content-primary">
                                    {ROLE_META[shown.to].label}
                                </strong>
                            </p>
                        </div>
                        <ul className="flex flex-col divide-y divide-ds-border-subtle rounded-ds-lg border border-ds-border-subtle">
                            {changes.map((c) => {
                                const gains = c.after !== false;
                                return (
                                    <li
                                        key={c.label}
                                        className="flex items-center gap-3 px-3 py-2"
                                    >
                                        <span
                                            className={dsCn(
                                                'flex size-6 shrink-0 items-center justify-center rounded-ds-full [&_svg]:size-3.5',
                                                gains
                                                    ? 'bg-ds-status-success-surface text-ds-status-success-content'
                                                    : 'bg-ds-status-danger-surface text-ds-status-danger-content',
                                            )}
                                        >
                                            {gains ? <Plus /> : <Minus />}
                                        </span>
                                        <span className="min-w-0 flex-1 text-ds-body-xs text-ds-content-primary">
                                            {c.label}
                                        </span>
                                        <span className="text-ds-caption text-ds-content-muted">
                                            {access(c.before)} →{' '}
                                            {access(c.after)}
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </DsModal>
        </>
    );
}
