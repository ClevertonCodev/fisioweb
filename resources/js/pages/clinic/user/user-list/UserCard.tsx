import { DragOverlay, useDndContext, useDraggable } from '@dnd-kit/core';
import { Crown, GripVertical, Lock } from 'lucide-react';

import { dsCn, DsDropdown, DsTooltip } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

import { ROLE_META, ROLES } from './roles';
import { GoogleSignal, RoleBadge, StatusBadge, UserAvatar } from './UserBadges';

const HANDLE =
    'flex h-10 w-6 shrink-0 items-center justify-center outline-0 focus-visible:shadow-ds-focus max-sm:hidden [&_svg]:size-4';

/**
 * Um cartão por pessoa; clicar abre o drawer. Inativo fica esmaecido. No
 * computador, o puxador arrasta a pessoa para uma função; no celular, o
 * "Mudar função". Quem não pode mudar (`roleLock`) mostra o motivo no lugar
 * do puxador, e o cartão fica sem "Mudar função".
 */
export function UserCard({
    user,
    roleLock,
    onOpen,
    onMove,
    overlay,
}: {
    user: ClinicUserSummary;
    roleLock: string | null;
    onOpen?: () => void;
    onMove?: (to: ClinicRole) => void;
    /** A cópia que acompanha o arraste: id próprio, não arrasta. */
    overlay?: boolean;
}) {
    const active = Boolean(user.status);
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: overlay ? `arrastando-${user.id}` : user.id,
        data: { user },
        disabled: roleLock !== null || overlay,
    });
    return (
        <div
            ref={overlay ? undefined : setNodeRef}
            data-inactive={active ? undefined : true}
            className={dsCn(
                'flex min-w-0 flex-wrap items-center gap-2 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:flex-nowrap',
                !active && 'opacity-70',
                isDragging && 'opacity-30',
                overlay && 'shadow-ds-md ring-2 ring-ds-primary-40',
            )}
        >
            {roleLock ? (
                <DsTooltip content={roleLock} asChild>
                    <span
                        role="img"
                        tabIndex={0}
                        aria-label={roleLock}
                        className={dsCn(HANDLE, 'cursor-not-allowed')}
                    >
                        {user.mestre === 1 ? (
                            <Crown className="text-ds-warning-80" />
                        ) : (
                            <Lock className="text-ds-content-subtle" />
                        )}
                    </span>
                </DsTooltip>
            ) : (
                <button
                    type="button"
                    aria-label={`Arrastar ${user.name} para outra função`}
                    className={dsCn(
                        HANDLE,
                        'cursor-grab touch-none text-ds-content-subtle hover:text-ds-content-secondary active:cursor-grabbing',
                    )}
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical />
                </button>
            )}
            <button
                type="button"
                aria-label={`Ver ${user.name}`}
                onClick={onOpen}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-0 focus-visible:rounded-ds-md focus-visible:shadow-ds-focus"
            >
                <UserAvatar user={user} />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex items-center gap-1.5 text-ds-body-sm font-semibold text-ds-content-primary">
                        <span className="truncate">{user.name}</span>
                        {user.mestre === 1 && (
                            <Crown
                                aria-label="Mestre"
                                className="size-3.5 shrink-0 text-ds-warning-80"
                            />
                        )}
                    </span>
                    <span className="truncate text-ds-caption text-ds-content-muted">
                        {user.email}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5">
                        <RoleBadge role={user.role} />
                        <StatusBadge active={active} />
                        <GoogleSignal
                            connected={Boolean(user.googleConnected)}
                            compact
                        />
                    </span>
                </span>
            </button>
            {/* Sem arrastar (celular): escolher a função, numa linha só dela. */}
            {onMove && roleLock === null && (
                <div className="basis-full border-t border-ds-border-subtle pt-2 sm:hidden">
                    <DsDropdown
                        mode="radio"
                        label={`Mudar função de ${user.name}`}
                        menuAlign="right"
                        menuTitle="Mudar para"
                        fixedLabel="Mudar função"
                        items={ROLES.map((r) => ({
                            key: r,
                            label: ROLE_META[r].label,
                        }))}
                        value={user.role}
                        onValueChange={(r) => {
                            if (r !== user.role) onMove(r as ClinicRole);
                        }}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * A pessoa sendo arrastada, lida do próprio dnd-kit: sem estado paralelo que
 * possa ficar preso se o fim do arraste se perder.
 */
export function useDraggedUser(): ClinicUserSummary | null {
    const { active } = useDndContext();
    return (
        (active?.data.current?.user as ClinicUserSummary | undefined) ?? null
    );
}

/** A cópia do cartão que acompanha o ponteiro durante o arraste. */
export function UserDragOverlay() {
    const user = useDraggedUser();
    return (
        <DragOverlay>
            {user && (
                <div className="w-80">
                    <UserCard user={user} roleLock={null} overlay />
                </div>
            )}
        </DragOverlay>
    );
}
