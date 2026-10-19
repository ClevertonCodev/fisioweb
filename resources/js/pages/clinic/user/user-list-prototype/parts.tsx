/**
 * PROTÓTIPO (descartável): peças comuns às variantes da tela de usuários.
 * "Editar" é real (abre a tela de edição); desativar, excluir e reenviar
 * acesso são stub.
 */
import {
    CalendarCheck,
    CalendarX,
    Check,
    Crown,
    KeyRound,
    Mail,
    Pencil,
    Power,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { DsBadge, DsButton, dsCn, DsDrawer, DsModal } from '@/components/ds';
import type { ClinicRole } from '@/domain/auth/session';
import { useIsMobile } from '@/pages/clinic/program/exercise-library-prototype/use-media-query';

import { CAPABILITIES, initialOf, ROLE_META, type Member } from './data';

// ---------------------------------------------------------------- selos

export function Avatar({
    member,
    size = 44,
    className,
}: {
    member: Pick<Member, 'name' | 'photoUrl'>;
    size?: number;
    className?: string;
}) {
    return (
        <span
            aria-hidden="true"
            className={dsCn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60',
                className,
            )}
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.4),
            }}
        >
            {member.photoUrl ? (
                <img
                    src={member.photoUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                initialOf(member.name)
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

/** Verificação em duas etapas e Google Agenda: o que a API já manda. */
export function SecuritySignals({
    member,
    compact,
}: {
    member: Member;
    compact?: boolean;
}) {
    const items = [
        member.twoFactorEnabled
            ? {
                  key: '2fa',
                  ok: true,
                  icon: <ShieldCheck />,
                  label: 'Duas etapas',
              }
            : {
                  key: '2fa',
                  ok: false,
                  icon: <ShieldAlert />,
                  label: 'Sem duas etapas',
              },
        member.googleConnected
            ? {
                  key: 'g',
                  ok: true,
                  icon: <CalendarCheck />,
                  label: 'Google Agenda',
              }
            : {
                  key: 'g',
                  ok: false,
                  icon: <CalendarX />,
                  label: 'Sem Google Agenda',
              },
    ];
    return (
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {items.map((i) => (
                <li
                    key={i.key}
                    title={i.label}
                    className={dsCn(
                        'flex items-center gap-1 text-ds-caption [&_svg]:size-3.5',
                        i.ok
                            ? 'text-ds-status-success-content'
                            : 'text-ds-content-muted',
                    )}
                >
                    {i.icon}
                    {compact ? (
                        <span className="sr-only">{i.label}</span>
                    ) : (
                        i.label
                    )}
                </li>
            ))}
        </ul>
    );
}

export function Stats({ member }: { member: Member }) {
    const stats = [
        { label: 'Pacientes', value: member.patients },
        { label: 'Programas', value: member.programs },
        { label: 'Agenda da semana', value: member.weekAppointments },
    ];
    return (
        <dl className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="rounded-ds-lg bg-ds-surface-subtle px-2 py-2.5 text-center"
                >
                    <dd className="font-ds-mono text-ds-body-lg font-semibold text-ds-content-primary">
                        {s.value}
                    </dd>
                    <dt className="text-[11px] leading-tight text-ds-content-muted">
                        {s.label}
                    </dt>
                </div>
            ))}
        </dl>
    );
}

// ---------------------------------------------------------------- ações

export function useMemberActions() {
    const navigate = useNavigate();
    const [toDelete, setToDelete] = useState<Member | null>(null);
    const [shown, setShown] = useState<Member | null>(null);
    if (toDelete && toDelete !== shown) setShown(toDelete);

    const deleteModal = (
        <DsModal
            open={toDelete !== null}
            onOpenChange={(o) => !o && setToDelete(null)}
            title="Excluir usuário"
            size="sm"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={() => setToDelete(null)}
                    />
                    <DsButton
                        variant="destructive"
                        label="Excluir"
                        onClick={() => {
                            toast.info('Protótipo: ninguém foi excluído.');
                            setToDelete(null);
                        }}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                Excluir <strong>{shown?.name}</strong>? A pessoa perde o acesso
                na hora. Se só vai se afastar, prefira desativar.
            </p>
        </DsModal>
    );

    return {
        edit: (m: Member) => navigate(`/clinica/usuarios/${m.id}/editar`),
        toggleActive: (m: Member) =>
            toast.info(
                `Protótipo: ${m.name} não foi ${m.active ? 'desativado(a)' : 'reativado(a)'}.`,
            ),
        resendAccess: (m: Member) =>
            toast.info(`Protótipo: nenhum e-mail foi enviado para ${m.email}.`),
        askDelete: setToDelete,
        deleteModal,
    };
}

// ---------------------------------------------------------------- detalhe

function Capability({ value }: { value: true | false | string }) {
    if (value === true) {
        return <Check className="size-4 text-ds-status-success-content" />;
    }
    if (value === false) {
        return <X className="size-4 text-ds-content-subtle" />;
    }
    return (
        <span className="text-ds-caption text-ds-content-secondary">
            {value}
        </span>
    );
}

/** O que a pessoa pode fazer na função dela. */
export function CapabilityList({ role }: { role: ClinicRole }) {
    return (
        <ul className="flex flex-col divide-y divide-ds-border-subtle">
            {CAPABILITIES.map((c) => (
                <li
                    key={c.key}
                    className="flex items-center justify-between gap-3 py-2"
                >
                    <span
                        className={dsCn(
                            'text-ds-body-xs',
                            c.access[role] === false
                                ? 'text-ds-content-muted'
                                : 'text-ds-content-primary',
                        )}
                    >
                        {c.label}
                    </span>
                    <Capability value={c.access[role]} />
                </li>
            ))}
        </ul>
    );
}

/** Painel lateral (de baixo no celular) com tudo sobre a pessoa. */
export function MemberDrawer({
    member,
    onClose,
}: {
    member: Member | null;
    onClose: () => void;
}) {
    const isMobile = useIsMobile();
    const actions = useMemberActions();
    const [shown, setShown] = useState<Member | null>(null);
    if (member && member !== shown) setShown(member);
    const m = member ?? shown;
    return (
        <>
            <DsDrawer
                open={member !== null}
                onOpenChange={(o) => !o && onClose()}
                placement={isMobile ? 'bottom' : 'right'}
                size="sm"
                surfaceClass={isMobile ? 'max-h-[92dvh]' : 'min-w-[400px]'}
                title={m?.name ?? ''}
                footer={
                    m && (
                        <div className="flex w-full items-center gap-2">
                            {m.mestre !== 1 && (
                                <DsButton
                                    variant="destructive-tertiary"
                                    iconPosition="only"
                                    icon={<Trash2 />}
                                    label="Excluir usuário"
                                    onClick={() => actions.askDelete(m)}
                                />
                            )}
                            <div className="ml-auto flex gap-2">
                                <DsButton
                                    variant="secondary"
                                    iconPosition="left"
                                    icon={<Power />}
                                    label={m.active ? 'Desativar' : 'Reativar'}
                                    disabled={m.mestre === 1}
                                    onClick={() => actions.toggleActive(m)}
                                />
                                <DsButton
                                    iconPosition="left"
                                    icon={<Pencil />}
                                    label="Editar"
                                    onClick={() => actions.edit(m)}
                                />
                            </div>
                        </div>
                    )
                }
            >
                {m && (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <Avatar member={m} size={64} />
                            <div className="flex min-w-0 flex-col gap-1.5">
                                <div className="flex flex-wrap gap-1.5">
                                    <RoleBadge role={m.role} />
                                    <StatusBadge active={m.active} />
                                    {m.mestre === 1 && <MasterBadge />}
                                </div>
                                <a
                                    href={`mailto:${m.email}`}
                                    className="flex items-center gap-1.5 truncate text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand [&_svg]:size-3.5"
                                >
                                    <Mail />
                                    {m.email}
                                </a>
                                {m.document && (
                                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                        {m.document}
                                    </span>
                                )}
                            </div>
                        </div>

                        <Stats member={m} />

                        <section className="flex flex-col gap-2">
                            <h3 className="text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase">
                                Conta
                            </h3>
                            <SecuritySignals member={m} />
                            {!m.twoFactorEnabled && (
                                <div>
                                    <DsButton
                                        variant="tertiary"
                                        size="sm"
                                        iconPosition="left"
                                        icon={<KeyRound />}
                                        label="Pedir para ativar as duas etapas"
                                        onClick={() => actions.resendAccess(m)}
                                    />
                                </div>
                            )}
                        </section>

                        <section className="flex flex-col gap-1">
                            <h3 className="text-ds-caption font-semibold tracking-[0.06em] text-ds-content-muted uppercase">
                                O que pode fazer · {ROLE_META[m.role].label}
                            </h3>
                            <CapabilityList role={m.role} />
                            {m.mestre === 1 && (
                                <p className="mt-2 text-ds-caption text-ds-content-muted">
                                    Mestre é o dono da conta: edita os dados da
                                    clínica e não pode ser excluído.
                                </p>
                            )}
                        </section>
                    </div>
                )}
            </DsDrawer>
            {actions.deleteModal}
        </>
    );
}
