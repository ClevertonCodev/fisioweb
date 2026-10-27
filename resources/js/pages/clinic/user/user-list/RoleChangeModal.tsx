import { ArrowRight, Minus, Plus } from 'lucide-react';

import { DsButton, dsCn, DsModal } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

import { accessLabel, capabilityDiff, ROLE_META } from './roles';
import { UserAvatar } from './UserBadges';

export interface RoleMove {
    user: ClinicUserSummary;
    to: ClinicRole;
}

/** Confirma a mudança de função mostrando o que a pessoa ganha e perde. */
export function RoleChangeModal({
    open,
    move,
    pending,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    /** Fica preenchido durante a animação de saída. */
    move: RoleMove | null;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const changes = move ? capabilityDiff(move.user.role, move.to) : [];
    return (
        <DsModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !pending) onCancel();
            }}
            title="Mudar função"
            size="sm"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={pending}
                        onClick={onCancel}
                    />
                    <DsButton
                        label="Mudar função"
                        loading={pending}
                        onClick={onConfirm}
                    />
                </div>
            }
        >
            {move && (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <UserAvatar user={move.user} size={40} />
                        <p className="flex flex-wrap items-center gap-1.5 text-ds-body-sm text-ds-content-secondary [&_svg]:size-4">
                            <strong className="text-ds-content-primary">
                                {move.user.name}
                            </strong>
                            {ROLE_META[move.user.role].label}
                            <ArrowRight aria-label="para" />
                            <strong className="text-ds-content-primary">
                                {ROLE_META[move.to].label}
                            </strong>
                        </p>
                    </div>
                    <ul
                        aria-label="O que muda"
                        className="flex flex-col divide-y divide-ds-border-subtle rounded-ds-lg border border-ds-border-subtle"
                    >
                        {changes.map((c) => {
                            const gains = c.change === 'gain';
                            return (
                                <li
                                    key={c.key}
                                    className="flex items-center gap-3 px-3 py-2"
                                >
                                    <span
                                        aria-label={gains ? 'Ganha' : 'Perde'}
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
                                        {accessLabel(c.before)} →{' '}
                                        {accessLabel(c.after)}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </DsModal>
    );
}
