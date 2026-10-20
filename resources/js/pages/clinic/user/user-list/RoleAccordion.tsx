import { useDroppable } from '@dnd-kit/core';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import { dsCn } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

import { ROLE_META, ROLES } from './roles';
import { CapabilityList } from './UserBadges';
import { useDraggedUser } from './UserCard';

function RoleItem({
    role,
    count,
    open,
    onToggle,
}: {
    role: ClinicRole;
    count: number | null;
    open: boolean;
    onToggle: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: role });
    const dragging = useDraggedUser();
    const canDrop = dragging !== null && dragging.role !== role;
    const panelId = `funcao-${role}`;
    const meta = ROLE_META[role];
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
                        meta.tone,
                    )}
                >
                    {meta.icon}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-ds-body-sm font-semibold text-ds-content-primary">
                        {meta.label}
                        {count !== null && (
                            <span className="font-ds-mono text-ds-caption font-normal text-ds-content-muted">
                                {count} {count === 1 ? 'pessoa' : 'pessoas'}
                            </span>
                        )}
                    </span>
                    <span className="block text-ds-caption text-ds-content-muted">
                        {isOver && canDrop
                            ? `Soltar aqui para mudar ${dragging.name.split(' ')[0]}`
                            : meta.description}
                    </span>
                </span>
                <ChevronDown
                    aria-hidden="true"
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

/**
 * Funções do sistema em sanfona; a contagem é a do recorte filtrado (sem
 * contagem quando a equipe não carregou). Cada função aceita uma pessoa
 * arrastada para cima dela.
 */
export function RoleAccordion({
    users,
}: {
    users: ClinicUserSummary[] | null;
}) {
    const [openRoles, setOpenRoles] = useState<ClinicRole[]>([]);
    const toggle = (role: ClinicRole) =>
        setOpenRoles((prev) =>
            prev.includes(role)
                ? prev.filter((r) => r !== role)
                : [...prev, role],
        );
    return (
        <aside
            aria-label="Funções do sistema"
            className="flex flex-col gap-3 lg:sticky lg:top-6"
        >
            <div>
                <h2 className="text-ds-body-md font-semibold text-ds-content-primary">
                    Funções do sistema
                </h2>
                <p className="text-ds-caption text-ds-content-muted max-sm:hidden">
                    Abra para ver o que cada função faz. Arraste alguém para
                    cima de uma função para mudar.
                </p>
            </div>
            <ul className="flex flex-col gap-2">
                {ROLES.map((role) => (
                    <RoleItem
                        key={role}
                        role={role}
                        count={
                            users
                                ? users.filter((u) => u.role === role).length
                                : null
                        }
                        open={openRoles.includes(role)}
                        onToggle={() => toggle(role)}
                    />
                ))}
            </ul>
        </aside>
    );
}
