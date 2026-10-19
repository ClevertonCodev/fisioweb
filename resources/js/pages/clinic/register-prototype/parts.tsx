/** PROTÓTIPO (descartável): campos e pedaços da tela de criar conta. */
import { Building2, Check, Link2, MailCheck, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { PasswordInput } from '@/components/clinic/auth/AuthLayout';
import { DsButton, dsCn, DsInput } from '@/components/ds';

import type { Register } from './shared';

export function TypeChoice({ r }: { r: Register }) {
    return (
        <div
            role="radiogroup"
            aria-label="Tipo"
            className="grid grid-cols-2 gap-2"
        >
            {(
                [
                    {
                        key: 'PJ',
                        label: 'Clínica (CNPJ)',
                        icon: <Building2 className="size-4" />,
                    },
                    {
                        key: 'PF',
                        label: 'Autônomo (CPF)',
                        icon: <User className="size-4" />,
                    },
                ] as const
            ).map((o) => (
                <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={r.v.typePerson === o.key}
                    onClick={() => r.setType(o.key)}
                    className={dsCn(
                        'flex cursor-pointer items-center justify-center gap-2 rounded-ds-md border px-3 py-2.5 text-ds-body-xs transition-colors',
                        r.v.typePerson === o.key
                            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand'
                            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-strong',
                    )}
                >
                    {o.icon}
                    {o.label}
                </button>
            ))}
        </div>
    );
}

const state = (e?: string) => (e ? 'error' : 'default');

export function ClinicFields({ r }: { r: Register }) {
    return (
        <>
            <DsInput
                label="Nome da clínica"
                placeholder="Ex.: Clínica Movimento"
                value={r.v.name}
                onValueChange={(v) => r.set('name', v)}
                onBlur={() => r.touch('name')}
                state={state(r.errorOf('name'))}
                helper={r.errorOf('name')}
                autocomplete="organization"
            />
            <TypeChoice r={r} />
            <DsInput
                label={r.v.typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                inputMode="numeric"
                value={r.v.document}
                onValueChange={r.setDocument}
                onBlur={() => r.touch('document')}
                state={state(r.errorOf('document'))}
                helper={r.errorOf('document')}
            />
        </>
    );
}

export function AccessFields({ r }: { r: Register }) {
    return (
        <>
            <DsInput
                label="E-mail"
                type="email"
                autocomplete="email"
                value={r.v.email}
                onValueChange={(v) => r.set('email', v)}
                onBlur={() => r.touch('email')}
                state={state(r.errorOf('email'))}
                helper={r.errorOf('email') ?? 'Você entra com ele.'}
            />
            <DsInput
                label="Telefone (opcional)"
                type="tel"
                placeholder="(00) 00000-0000"
                value={r.v.phone}
                onValueChange={r.setPhone}
                onBlur={() => r.touch('phone')}
                state={state(r.errorOf('phone'))}
                helper={r.errorOf('phone')}
            />
            <div className="flex flex-col gap-2">
                <PasswordInput
                    label="Senha"
                    autocomplete="new-password"
                    value={r.v.password}
                    onValueChange={(v) => r.set('password', v)}
                    onBlur={() => r.touch('password')}
                    state={state(r.errorOf('password'))}
                    helper={r.errorOf('password')}
                />
                {r.v.password && <Strength r={r} />}
            </div>
            <PasswordInput
                label="Confirmar senha"
                autocomplete="new-password"
                value={r.v.passwordConfirmation}
                onValueChange={(v) => r.set('passwordConfirmation', v)}
                onBlur={() => r.touch('passwordConfirmation')}
                state={state(r.errorOf('passwordConfirmation'))}
                helper={r.errorOf('passwordConfirmation')}
            />
        </>
    );
}

function Strength({ r }: { r: Register }) {
    const { score, checks, label } = r.strength;
    const color = [
        'var(--ds-color-danger-100)',
        'var(--ds-color-danger-100)',
        'var(--ds-color-warning-100)',
        'var(--ds-color-success-80)',
        'var(--ds-color-success-100)',
    ][score];
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                    {[0, 1, 2, 3].map((i) => (
                        <span
                            key={i}
                            className="h-1 flex-1 rounded-ds-pill bg-ds-surface-subtle"
                            style={
                                i < score ? { background: color } : undefined
                            }
                        />
                    ))}
                </div>
                <span className="text-ds-caption text-ds-content-secondary">
                    {label}
                </span>
            </div>
            <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
                {checks.map((c) => (
                    <li
                        key={c.label}
                        className={dsCn(
                            'flex items-center gap-1 text-ds-caption',
                            c.ok
                                ? 'text-ds-status-success-content'
                                : 'text-ds-content-muted',
                        )}
                    >
                        {c.ok ? (
                            <Check className="size-3" />
                        ) : (
                            <X className="size-3" />
                        )}
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function SlugField({ r }: { r: Register }) {
    const err = r.slugTaken ? r.allErrors.slug : r.errorOf('slug');
    return (
        <div className="flex flex-col gap-1.5">
            <DsInput
                label="Endereço dos links dos pacientes"
                value={r.v.slug}
                onValueChange={r.setSlug}
                onBlur={() => r.touch('slug')}
                iconLeft={<Link2 />}
                state={err ? 'error' : r.v.slug ? 'success' : 'default'}
                helper={
                    err ??
                    (r.v.slug
                        ? 'Disponível. Depois de criado, não muda.'
                        : 'Sai do nome da clínica.')
                }
            />
            <p className="truncate rounded-ds-md bg-ds-surface-subtle px-3 py-2 font-ds-mono text-ds-caption text-ds-content-secondary">
                {r.linkPreview}
            </p>
        </div>
    );
}

/** Depois de "Criar conta" (stub). */
export function Done({ r }: { r: Register }) {
    const navigate = useNavigate();
    return (
        <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-status-success-surface text-ds-status-success-content">
                <MailCheck className="size-7" />
            </span>
            <div>
                <p className="text-ds-body-lg font-semibold">
                    Conta criada (protótipo)
                </p>
                <p className="mt-1 text-ds-body-xs text-ds-content-secondary">
                    Mandaríamos um e-mail para <b>{r.v.email}</b> confirmar o
                    acesso. O auto-cadastro ainda não existe no backend; nada
                    foi criado.
                </p>
            </div>
            <DsButton
                size="full"
                label="Ir para o login"
                onClick={() => navigate('/clinica/login')}
            />
        </div>
    );
}
