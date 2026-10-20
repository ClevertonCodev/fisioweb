/**
 * PROTÓTIPO (descartável): campos e peças da edição de usuário. Os campos
 * ligam no formulário real (form.ts); Google Agenda mostra o estado real,
 * mas conectar e desconectar são stub.
 */
import {
    CalendarCheck,
    Camera,
    Check,
    MailCheck,
    Trash2,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Controller } from 'react-hook-form';
import { toast } from 'sonner';

import { useGoogleCalendarStatus } from '@/application/clinic';
import {
    CLINIC_USER_ROLES,
    type ClinicUserFormRole,
} from '@/application/clinic/clinic-user-form';
import {
    DsBadge,
    DsButton,
    dsCn,
    DsCnpjField,
    DsCpfField,
    DsInput,
    DsModal,
    DsSwitch,
} from '@/components/ds';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import type { ClinicUserDocumentKind } from '@/lib/br-document-validation';

import {
    DOCUMENT_KIND_LABEL,
    maskEmail,
    passwordScore,
    SCORE_LABEL,
    type UserEditForm,
} from './form';
import { CAPABILITIES, ROLE_META, type Member } from './team-data';

export interface VariantProps {
    user: ClinicUserSummary;
    f: UserEditForm;
    canManageUsers: boolean;
    isOwnProfile: boolean;
    /** Mestre: a função fica administrador e a conta não se desativa. */
    roleLocked: boolean;
    /** Motivo para não poder trocar a senha (null = pode). */
    passwordLock: string | null;
    /** Carga da pessoa (pacientes, programas, agenda da semana). */
    member: Member | null;
    backTo: string;
}

export function roleLabel(r: ClinicUserFormRole): string {
    return ROLE_META[r].label;
}

export function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    return (
        (parts[0]?.[0] ?? '') +
        (parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '')
    ).toUpperCase();
}

// ------------------------------------------------------------- foto

export function Avatar({
    url,
    name,
    size = 72,
    className,
}: {
    url: string | null;
    name: string;
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
                fontSize: Math.round(size * 0.36),
            }}
        >
            {url ? (
                <img src={url} alt="" className="size-full object-cover" />
            ) : (
                initials(name || '?')
            )}
        </span>
    );
}

/** Seletor de arquivo escondido; `open()` abre a janela de escolha. */
function usePhotoInput(f: UserEditForm) {
    const input = useRef<HTMLInputElement>(null);
    const element = (
        <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) f.setPhoto(file);
                e.target.value = '';
            }}
        />
    );
    return { open: () => input.current?.click(), element };
}

/**
 * A foto da pessoa, clicável para trocar. É a única foto da tela: os
 * botões ("Trocar", "Remover") ficam no PhotoActions, sem repetir a foto.
 */
export function PhotoAvatar({
    f,
    name,
    size = 88,
    className,
}: {
    f: UserEditForm;
    name: string;
    size?: number;
    className?: string;
}) {
    const picker = usePhotoInput(f);
    return (
        <>
            <button
                type="button"
                onClick={picker.open}
                className={dsCn(
                    'group relative shrink-0 cursor-pointer rounded-ds-full focus-visible:shadow-ds-focus focus-visible:outline-0',
                    className,
                )}
                aria-label="Trocar foto"
            >
                <Avatar url={f.photo.url} name={name} size={size} />
                <span className="absolute inset-0 flex items-center justify-center rounded-ds-full bg-ds-black/45 text-ds-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Camera className="size-6" />
                </span>
            </button>
            {picker.element}
        </>
    );
}

/** "Trocar foto" e "Remover", sem a foto. O recorte da v1 fica para a tela real. */
export function PhotoActions({
    f,
    hint = 'JPG ou PNG, quadrada de preferência.',
}: {
    f: UserEditForm;
    hint?: string;
}) {
    const picker = usePhotoInput(f);
    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-wrap gap-1">
                <DsButton
                    size="sm"
                    variant="secondary"
                    iconPosition="left"
                    icon={<Camera />}
                    label={f.photo.url ? 'Trocar foto' : 'Enviar foto'}
                    onClick={picker.open}
                />
                {f.photo.url && (
                    <DsButton
                        size="sm"
                        variant="destructive-tertiary"
                        iconPosition="only"
                        icon={<Trash2 />}
                        label="Remover foto"
                        onClick={() => f.setPhoto(null)}
                    />
                )}
            </div>
            {hint && (
                <p className="text-ds-caption text-ds-content-muted">{hint}</p>
            )}
            {picker.element}
        </div>
    );
}

// ------------------------------------------------------------- campos

export function NameField({ f }: { f: UserEditForm }) {
    const err = f.form.formState.errors.name?.message;
    return (
        <DsInput
            label="Nome"
            autocomplete="name"
            placeholder="Nome completo"
            state={err ? 'error' : 'default'}
            helper={err}
            {...f.form.register('name')}
        />
    );
}

export function EmailField({ f }: { f: UserEditForm }) {
    const err = f.form.formState.errors.email?.message;
    return (
        <DsInput
            label="E-mail"
            type="email"
            autocomplete="email"
            placeholder="voce@clinica.com"
            state={err ? 'error' : 'default'}
            helper={err ?? 'É o login da pessoa.'}
            {...f.form.register('email')}
        />
    );
}

export function PasswordMeter({ value }: { value: string }) {
    const score = passwordScore(value);
    if (!value) return null;
    const tone =
        score <= 1
            ? 'bg-ds-status-danger-content'
            : score === 2
              ? 'bg-ds-status-warning-content'
              : 'bg-ds-status-success-content';
    return (
        <div className="flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        className={dsCn(
                            'h-1.5 flex-1 rounded-ds-pill bg-ds-surface-subtle',
                            i <= score && tone,
                        )}
                    />
                ))}
            </div>
            <span className="w-16 text-right text-ds-caption text-ds-content-secondary">
                {SCORE_LABEL[score]}
            </span>
        </div>
    );
}

export function PasswordFields({ f }: { f: UserEditForm }) {
    const errors = f.form.formState.errors;
    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                    <DsInput
                        label="Nova senha"
                        type="password"
                        autocomplete="new-password"
                        placeholder="Mínimo de 8 caracteres"
                        state={errors.password ? 'error' : 'default'}
                        helper={errors.password?.message}
                        {...f.form.register('password')}
                    />
                </div>
                <div className="flex-1">
                    <DsInput
                        label="Confirmar nova senha"
                        type="password"
                        autocomplete="new-password"
                        placeholder="Repita a senha"
                        disabled={!f.values.password}
                        state={errors.confirmPassword ? 'error' : 'default'}
                        helper={errors.confirmPassword?.message}
                        {...f.form.register('confirmPassword')}
                    />
                </div>
            </div>
            <PasswordMeter value={f.values.password ?? ''} />
            {f.values.password && (
                <p className="flex items-center gap-1.5 text-ds-caption text-ds-content-secondary [&_svg]:size-3.5">
                    <MailCheck />
                    Ao salvar, enviamos um código para{' '}
                    {maskEmail(f.code.recipient)} para confirmar a troca.
                </p>
            )}
        </div>
    );
}

const RESEND_AFTER = 30;

/** Seis casas para o código; um input só por baixo (colar funciona). */
function CodeInput({
    value,
    onChange,
    invalid,
}: {
    value: string;
    onChange: (v: string) => void;
    invalid: boolean;
}) {
    const [focused, setFocused] = useState(false);
    return (
        <div className="relative mx-auto w-fit">
            <input
                autoFocus
                value={value}
                onChange={(e) =>
                    onChange(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="Código de 6 dígitos"
                aria-invalid={invalid || undefined}
                className="absolute inset-0 cursor-text opacity-0"
            />
            <div aria-hidden="true" className="flex gap-2">
                {Array.from({ length: 6 }, (_, i) => {
                    const current =
                        focused &&
                        (i === value.length || (value.length === 6 && i === 5));
                    return (
                        <span
                            key={i}
                            className={dsCn(
                                'flex size-12 items-center justify-center rounded-ds-lg border bg-ds-surface-default font-ds-mono text-ds-h4 font-semibold transition-[border-color,box-shadow]',
                                invalid
                                    ? 'border-ds-status-danger-content'
                                    : current
                                      ? 'border-ds-primary-80 shadow-ds-focus ds-dark:border-ds-primary-60'
                                      : 'border-ds-border-default',
                            )}
                        >
                            {value[i] ?? ''}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

/**
 * Confirmação da troca de senha. O código vai para quem está logado: no
 * próprio perfil, a pessoa; editando outra conta, o administrador.
 */
export function PasswordCodeModal({
    f,
    targetName,
    isOwnProfile,
}: {
    f: UserEditForm;
    targetName: string;
    isOwnProfile: boolean;
}) {
    const step = f.code.step;
    const [typed, setTyped] = useState('');
    const [wrong, setWrong] = useState(false);
    const [wait, setWait] = useState(RESEND_AFTER);
    const [shownFor, setShownFor] = useState<number | null>(null);

    // Código novo (ou reenviado): limpa o que foi digitado.
    if (step && step.sendId !== shownFor) {
        setShownFor(step.sendId);
        setTyped('');
        setWrong(false);
        setWait(RESEND_AFTER);
    }

    // Contagem para liberar o reenvio, a partir de cada envio.
    const sendId = step?.sendId;
    useEffect(() => {
        if (sendId === undefined) return;
        const start = Date.now();
        const id = window.setInterval(() => {
            const left = RESEND_AFTER - Math.floor((Date.now() - start) / 1000);
            setWait(Math.max(0, left));
        }, 250);
        return () => window.clearInterval(id);
    }, [sendId]);

    const confirm = () => {
        if (!f.code.confirm(typed)) setWrong(true);
    };

    return (
        <DsModal
            open={!!step}
            onOpenChange={(o) => !o && f.code.cancel()}
            title="Confirme a troca de senha"
            size="sm"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Voltar"
                        onClick={f.code.cancel}
                    />
                    <DsButton
                        label="Confirmar e salvar"
                        disabled={typed.length < 6}
                        onClick={confirm}
                    />
                </div>
            }
        >
            <form
                className="flex flex-col items-center gap-5 text-center"
                onSubmit={(e) => {
                    e.preventDefault();
                    if (typed.length === 6) confirm();
                }}
            >
                <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60">
                    <MailCheck className="size-7" />
                </span>
                <p className="text-ds-body-sm text-ds-content-secondary">
                    {isOwnProfile ? (
                        <>
                            Enviamos um código de 6 dígitos para{' '}
                            <strong className="font-semibold text-ds-content-primary">
                                {maskEmail(f.code.recipient)}
                            </strong>
                            .
                        </>
                    ) : (
                        <>
                            Para trocar a senha de{' '}
                            <strong className="font-semibold text-ds-content-primary">
                                {targetName}
                            </strong>
                            , enviamos um código para o seu e-mail de
                            administrador,{' '}
                            <strong className="font-semibold text-ds-content-primary">
                                {maskEmail(f.code.recipient)}
                            </strong>
                            .
                        </>
                    )}
                </p>
                <CodeInput
                    value={typed}
                    invalid={wrong}
                    onChange={(v) => {
                        setTyped(v);
                        setWrong(false);
                    }}
                />
                <p
                    role={wrong ? 'alert' : undefined}
                    className={dsCn(
                        'min-h-5 text-ds-caption',
                        wrong
                            ? 'text-ds-content-danger'
                            : 'text-ds-content-muted',
                    )}
                >
                    {wrong
                        ? 'Código incorreto. Confira o e-mail e tente de novo.'
                        : 'O código vale por 10 minutos.'}
                </p>
                <DsButton
                    size="sm"
                    variant="tertiary"
                    label={
                        wait > 0
                            ? `Reenviar código em ${wait}s`
                            : 'Reenviar código'
                    }
                    disabled={wait > 0}
                    onClick={f.code.resend}
                />
            </form>
        </DsModal>
    );
}

const KINDS: ClinicUserDocumentKind[] = ['crefito', 'cpf', 'cnpj'];

export function DocumentFields({ f }: { f: UserEditForm }) {
    const kind = f.values.documentKind;
    const err = f.form.formState.errors.document?.message;
    return (
        <div className="flex flex-col gap-3">
            <div
                role="radiogroup"
                aria-label="Tipo de documento"
                className="flex w-fit gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
            >
                {KINDS.map((k) => (
                    <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={kind === k}
                        onClick={() => {
                            if (kind === k) return;
                            f.form.setValue('documentKind', k, {
                                shouldDirty: true,
                            });
                            f.form.setValue('document', '', {
                                shouldDirty: true,
                            });
                        }}
                        className={dsCn(
                            'cursor-pointer rounded-ds-md px-3 py-1.5 text-ds-body-xs transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
                            kind === k
                                ? 'bg-ds-surface-default font-medium text-ds-content-primary shadow-ds-xs'
                                : 'text-ds-content-secondary hover:text-ds-content-primary',
                        )}
                    >
                        {DOCUMENT_KIND_LABEL[k]}
                    </button>
                ))}
            </div>
            <Controller
                control={f.form.control}
                name="document"
                render={({ field }) =>
                    kind === 'cpf' ? (
                        <DsCpfField
                            label="CPF"
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            invalid={!!err}
                            helperText={err}
                        />
                    ) : kind === 'cnpj' ? (
                        <DsCnpjField
                            label="CNPJ"
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            invalid={!!err}
                            helperText={err}
                        />
                    ) : (
                        <DsInput
                            label="Registro no CREFITO"
                            placeholder="Ex.: MG-123456 ou SP 123456-G"
                            value={field.value}
                            onValueChange={field.onChange}
                            onBlur={field.onBlur}
                            state={err ? 'error' : 'default'}
                            helper={
                                err ??
                                'Sai na assinatura das evoluções e dos programas.'
                            }
                        />
                    )
                }
            />
        </div>
    );
}

export function StatusSwitch({
    f,
    disabled,
}: {
    f: UserEditForm;
    disabled?: boolean;
}) {
    const active = f.values.status === '1';
    return (
        <DsSwitch
            label={active ? 'Conta ativa' : 'Conta desativada'}
            description={
                disabled
                    ? 'O mestre da clínica não pode ser desativado.'
                    : active
                      ? 'Entra no sistema e aparece na agenda.'
                      : 'Não entra mais; os registros dela continuam.'
            }
            checked={active}
            disabled={disabled}
            onCheckedChange={(on) =>
                f.form.setValue('status', on ? '1' : '0', { shouldDirty: true })
            }
        />
    );
}

// ------------------------------------------------------------- função

function Access({ value }: { value: true | false | string }) {
    if (value === true) {
        return <Check className="size-3.5 text-ds-status-success-content" />;
    }
    if (value === false) {
        return <X className="size-3.5 text-ds-content-subtle" />;
    }
    return <span className="text-ds-caption">{value}</span>;
}

/** Funções como cartões; o escolhido mostra o que muda em relação ao atual. */
export function RoleCards({
    f,
    disabled,
}: {
    f: UserEditForm;
    disabled?: boolean;
}) {
    const current = f.defaultValues.role;
    const picked = f.values.role;
    const diff =
        picked !== current
            ? CAPABILITIES.filter((c) => c.access[picked] !== c.access[current])
            : [];
    return (
        <div className="flex flex-col gap-3">
            <div
                role="radiogroup"
                aria-label="Função"
                className="grid gap-3 sm:grid-cols-3"
            >
                {CLINIC_USER_ROLES.map((r) => {
                    const on = picked === r;
                    return (
                        <button
                            key={r}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={disabled && !on}
                            onClick={() =>
                                f.form.setValue('role', r, {
                                    shouldDirty: true,
                                })
                            }
                            className={dsCn(
                                'flex cursor-pointer flex-col gap-1 rounded-ds-lg border p-3 text-left transition-[border-color,box-shadow] focus-visible:shadow-ds-focus focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-50',
                                on
                                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle shadow-ds-xs ds-dark:border-ds-primary-60'
                                    : 'border-ds-border-subtle bg-ds-surface-default hover:border-ds-border-brand-subtle',
                            )}
                        >
                            <span className="flex items-center justify-between gap-2">
                                <span className="text-ds-body-xs font-semibold">
                                    {ROLE_META[r].label}
                                </span>
                                {r === current && <DsBadge>Atual</DsBadge>}
                            </span>
                            <span className="text-ds-caption text-ds-content-secondary">
                                {ROLE_META[r].description}
                            </span>
                        </button>
                    );
                })}
            </div>
            {disabled && (
                <p className="text-ds-caption text-ds-content-muted">
                    Este é o mestre da clínica: a função fica administrador.
                </p>
            )}
            {diff.length > 0 && (
                <div className="rounded-ds-lg border border-ds-status-warning-border bg-ds-status-warning-surface p-3">
                    <p className="mb-2 text-ds-body-xs font-semibold text-ds-status-warning-content">
                        De {ROLE_META[current].label} para{' '}
                        {ROLE_META[picked].label}, muda:
                    </p>
                    <ul className="flex flex-col gap-1">
                        {diff.map((c) => (
                            <li
                                key={c.key}
                                className="flex items-center gap-2 text-ds-caption text-ds-content-primary"
                            >
                                <span className="flex-1">{c.label}</span>
                                <span className="flex items-center gap-1 text-ds-content-muted">
                                    <Access value={c.access[current]} />
                                </span>
                                <span aria-hidden="true">→</span>
                                <span className="flex w-24 items-center justify-end gap-1">
                                    <Access value={c.access[picked]} />
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------- conta

export function GoogleRow({ isOwnProfile }: { isOwnProfile: boolean }) {
    const { data, isLoading } = useGoogleCalendarStatus();
    const connected = isOwnProfile ? !!data?.connected : undefined;
    return (
        <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-ds-md bg-ds-status-info-surface text-ds-status-info-content">
                <CalendarCheck className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-ds-body-xs font-medium">Google Agenda</p>
                <p className="text-ds-caption text-ds-content-muted">
                    {!isOwnProfile
                        ? 'Só a própria pessoa conecta, no perfil dela.'
                        : isLoading
                          ? 'Verificando…'
                          : connected
                            ? `Conectado${data?.connectedAt ? ` em ${new Date(data.connectedAt).toLocaleDateString('pt-BR')}` : ''}. As consultas vão para o Google.`
                            : 'Mande as consultas para o seu Google Agenda.'}
                </p>
            </div>
            {isOwnProfile && !isLoading && (
                <DsButton
                    size="sm"
                    variant={connected ? 'secondary' : 'primary'}
                    label={connected ? 'Desconectar' : 'Conectar'}
                    onClick={() =>
                        toast.info(
                            `Protótipo: ${connected ? 'desconectar' : 'conectar'} o Google é stub aqui.`,
                        )
                    }
                />
            )}
        </div>
    );
}

/**
 * Barra de salvar: no celular, presa embaixo (com folga para a barra do
 * protótipo); no desktop, um cartão flutuando à direita.
 */
export function SaveBar({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={dsCn(
                'fixed inset-x-0 bottom-0 z-10 border-t border-ds-border-subtle bg-ds-surface-default/95 px-4 pt-3 pb-20 backdrop-blur sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[min(440px,calc(100vw-48px))] sm:rounded-ds-xl sm:border sm:pb-3 sm:shadow-ds-md lg:right-10',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function SectionTitle({
    title,
    hint,
}: {
    title: string;
    hint?: string;
}) {
    return (
        <div className="mb-4">
            <h2 className="text-ds-body-emphasis">{title}</h2>
            {hint && (
                <p className="text-ds-caption text-ds-content-muted">{hint}</p>
            )}
        </div>
    );
}
