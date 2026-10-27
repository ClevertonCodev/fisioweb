import { CalendarCheck, CalendarX, Check, Crown, X } from 'lucide-react';

import { DsBadge, dsCn } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

import { CAPABILITIES, ROLE_META, type Access } from './roles';

export function initialOf(name: string): string {
    return name.trim()[0]?.toUpperCase() ?? '?';
}

export function UserAvatar({
    user,
    size = 44,
}: {
    user: Pick<ClinicUserSummary, 'name' | 'photoUrl'>;
    size?: number;
}) {
    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.4),
            }}
        >
            {user.photoUrl ? (
                <img
                    src={user.photoUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                initialOf(user.name)
            )}
        </span>
    );
}

const ROLE_BADGE: Record<ClinicRole, 'primary' | 'info' | 'warning'> = {
    admin: 'primary',
    physiotherapist: 'info',
    secretary: 'warning',
};

export function RoleBadge({ role }: { role: ClinicRole }) {
    return (
        <DsBadge variant={ROLE_BADGE[role]}>{ROLE_META[role].label}</DsBadge>
    );
}

export function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <DsBadge variant="success" dot>
            Ativo
        </DsBadge>
    ) : (
        <DsBadge dot>Inativo</DsBadge>
    );
}

export function MasterBadge() {
    return (
        <DsBadge variant="new" icon={<Crown />}>
            Mestre
        </DsBadge>
    );
}

/**
 * Google Agenda conectado ou não. A verificação em duas etapas fica fora da
 * tela enquanto não existir no backend (ADR 019).
 */
export function GoogleSignal({
    connected,
    compact,
}: {
    connected: boolean;
    compact?: boolean;
}) {
    const label = connected ? 'Google Agenda' : 'Sem Google Agenda';
    return (
        <span
            title={label}
            className={dsCn(
                'flex items-center gap-1 text-ds-caption [&_svg]:size-3.5',
                connected
                    ? 'text-ds-status-success-content'
                    : 'text-ds-content-muted',
            )}
        >
            {connected ? <CalendarCheck /> : <CalendarX />}
            {compact ? <span className="sr-only">{label}</span> : label}
        </span>
    );
}

function AccessMark({ value }: { value: Access }) {
    if (value === true) {
        return (
            <Check
                aria-label="Sim"
                className="size-4 text-ds-status-success-content"
            />
        );
    }
    if (value === false) {
        return <X aria-label="Não" className="size-4 text-ds-content-subtle" />;
    }
    return (
        <span className="text-ds-caption text-ds-content-secondary">
            {value}
        </span>
    );
}

/** O que a função pode fazer. */
export function CapabilityList({ role }: { role: ClinicRole }) {
    return (
        <ul className="flex flex-col divide-y divide-ds-border-subtle">
            {CAPABILITIES.map((c) => {
                const value = c.access(role);
                return (
                    <li
                        key={c.key}
                        className="flex items-center justify-between gap-3 py-2"
                    >
                        <span
                            className={dsCn(
                                'text-ds-body-xs',
                                value === false
                                    ? 'text-ds-content-muted'
                                    : 'text-ds-content-primary',
                            )}
                        >
                            {c.label}
                        </span>
                        <AccessMark value={value} />
                    </li>
                );
            })}
        </ul>
    );
}
