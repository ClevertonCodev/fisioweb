import { Mail, Pencil, Power, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { clinicUserLocks } from '@/application/clinic/clinic-user-locks';
import { DsButton, DsDrawer, DsTooltip, dsCn } from '@/components/ds';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { useIsMobile } from '@/hooks/use-mobile';

import { ROLE_META } from './roles';
import { useUserWorkload } from './use-user-workload';
import {
    CapabilityList,
    GoogleSignal,
    MasterBadge,
    RoleBadge,
    StatusBadge,
    UserAvatar,
} from './UserBadges';

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase">
            {children}
        </h3>
    );
}

function Workload({ user }: { user: ClinicUserSummary }) {
    const workload = useUserWorkload(user);
    const stats = [
        { label: 'Pacientes', value: workload.patients },
        { label: 'Programas', value: workload.programs },
        { label: 'Agenda da semana', value: workload.weekAppointments },
    ];
    return (
        <dl className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="flex flex-col-reverse rounded-ds-lg bg-ds-surface-subtle px-2 py-2.5 text-center"
                >
                    <dt className="text-ds-caption leading-tight text-ds-content-muted">
                        {s.label}
                    </dt>
                    <dd
                        className={dsCn(
                            'font-ds-mono text-ds-body-lg font-semibold text-ds-content-primary',
                            workload.isLoading && 'animate-pulse',
                        )}
                    >
                        {workload.isLoading ? '–' : s.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}

/**
 * Desativar ou reativar. Travado (mestre, último admin ativo), o botão fica
 * `aria-disabled` com o motivo no tooltip e não chama nada (ADR 017).
 */
function StatusButton({
    user,
    lock,
    onClick,
}: {
    user: ClinicUserSummary;
    lock: string | null;
    onClick: () => void;
}) {
    const label = user.status ? 'Desativar' : 'Reativar';
    if (lock) {
        return (
            <DsTooltip content={lock} asChild>
                <DsButton
                    variant="secondary"
                    iconPosition="left"
                    icon={<Power />}
                    label={label}
                    aria-disabled="true"
                    className="cursor-not-allowed opacity-50"
                />
            </DsTooltip>
        );
    }
    return (
        <DsButton
            variant="secondary"
            iconPosition="left"
            icon={<Power />}
            label={label}
            onClick={onClick}
        />
    );
}

/** Painel da pessoa: à direita no computador, de baixo no celular. */
export function UserDrawer({
    user,
    team,
    onClose,
    onEdit,
    onToggleStatus,
    onDelete,
}: {
    user: ClinicUserSummary | null;
    /** A equipe inteira, para as travas de mestre e último admin ativo. */
    team: ClinicUserSummary[];
    onClose: () => void;
    onEdit: (user: ClinicUserSummary) => void;
    onToggleStatus: (user: ClinicUserSummary) => void;
    onDelete: (user: ClinicUserSummary) => void;
}) {
    const isMobile = useIsMobile();
    // Continua mostrando a última pessoa durante a animação de saída.
    const [shown, setShown] = useState(user);
    if (user && user !== shown) setShown(user);
    const u = user ?? shown;
    const locks = u ? clinicUserLocks(u, team) : null;

    return (
        <DsDrawer
            open={user !== null}
            onOpenChange={(open) => !open && onClose()}
            placement={isMobile ? 'bottom' : 'right'}
            size="sm"
            surfaceClass={isMobile ? 'max-h-[92dvh]' : 'min-w-[400px]'}
            title={u?.name ?? ''}
            footer={
                u &&
                locks && (
                    <div className="flex w-full items-center gap-2">
                        {locks.canDelete && (
                            <DsButton
                                variant="destructive-tertiary"
                                iconPosition="only"
                                icon={<Trash2 />}
                                label="Excluir usuário"
                                onClick={() => onDelete(u)}
                            />
                        )}
                        <div className="ml-auto flex gap-2">
                            <StatusButton
                                user={u}
                                lock={locks.deactivate}
                                onClick={() => onToggleStatus(u)}
                            />
                            <DsButton
                                iconPosition="left"
                                icon={<Pencil />}
                                label="Editar"
                                onClick={() => onEdit(u)}
                            />
                        </div>
                    </div>
                )
            }
        >
            {u && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                        <UserAvatar user={u} size={64} />
                        <div className="flex min-w-0 flex-col gap-1.5">
                            <div className="flex flex-wrap gap-1.5">
                                <RoleBadge role={u.role} />
                                <StatusBadge active={Boolean(u.status)} />
                                {u.mestre === 1 && <MasterBadge />}
                            </div>
                            <a
                                href={`mailto:${u.email}`}
                                className="flex items-center gap-1.5 truncate text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand [&_svg]:size-3.5"
                            >
                                <Mail />
                                {u.email}
                            </a>
                            {u.document && (
                                <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                    {u.document}
                                </span>
                            )}
                        </div>
                    </div>

                    {user && <Workload user={user} />}

                    <section className="flex flex-col gap-2">
                        <SectionTitle>Conta</SectionTitle>
                        <GoogleSignal connected={Boolean(u.googleConnected)} />
                    </section>

                    <section className="flex flex-col gap-1">
                        <SectionTitle>
                            O que pode fazer · {ROLE_META[u.role].label}
                        </SectionTitle>
                        <CapabilityList role={u.role} />
                        {u.mestre === 1 && (
                            <p className="mt-2 text-ds-caption text-ds-content-muted">
                                Mestre é o dono da conta: edita os dados da
                                clínica e não pode ser excluído.
                            </p>
                        )}
                    </section>
                </div>
            )}
        </DsDrawer>
    );
}
