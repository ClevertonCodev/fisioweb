/** PROTÓTIPO (descartável): grupos de campos dos dados da clínica. */
import { Building2, User } from 'lucide-react';

import {
    applyMask,
    dsCn,
    DsFieldSelect,
    DsInput,
    formatCnpj,
    formatCpf,
} from '@/components/ds';

import { type ClinicData, formatPhone, UFS } from './shared';

export function IdentityFields({ c }: { c: ClinicData }) {
    const { form, set, errors, canEdit } = c;
    return (
        <div className="flex flex-col gap-4">
            <DsInput
                label="Nome da clínica"
                value={form.name}
                onValueChange={(v) => set('name', v)}
                readonly={!canEdit}
                state={errors.name ? 'error' : 'default'}
                helper={errors.name}
            />
            <div className="flex flex-col gap-1.5">
                <span className="text-ds-caption font-medium">Tipo</span>
                <div
                    role="radiogroup"
                    aria-label="Tipo de pessoa"
                    className="grid grid-cols-2 gap-2"
                >
                    {(
                        [
                            {
                                key: 'PJ',
                                label: 'Empresa (CNPJ)',
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
                            aria-checked={form.typePerson === o.key}
                            disabled={!canEdit}
                            onClick={() => c.setTypePerson(o.key)}
                            className={dsCn(
                                'flex items-center justify-center gap-2 rounded-ds-md border px-3 py-2.5 text-ds-body-xs transition-colors',
                                form.typePerson === o.key
                                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-40'
                                    : 'border-ds-border-default text-ds-content-secondary',
                                canEdit
                                    ? 'cursor-pointer hover:border-ds-border-strong'
                                    : 'opacity-70',
                            )}
                        >
                            {o.icon}
                            {o.label}
                        </button>
                    ))}
                </div>
            </div>
            <DsInput
                label={form.typePerson === 'PF' ? 'CPF' : 'CNPJ'}
                value={form.document}
                onValueChange={(v) =>
                    set(
                        'document',
                        form.typePerson === 'PF' ? formatCpf(v) : formatCnpj(v),
                    )
                }
                readonly={!canEdit}
                state={errors.document ? 'error' : 'default'}
                helper={errors.document}
                inputMode="numeric"
            />
        </div>
    );
}

export function ContactFields({ c }: { c: ClinicData }) {
    const { form, set, errors, canEdit } = c;
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DsInput
                label="E-mail"
                type="email"
                value={form.email}
                onValueChange={(v) => set('email', v)}
                readonly={!canEdit}
                state={errors.email ? 'error' : 'default'}
                helper={errors.email ?? 'E-mail de contato da clínica.'}
            />
            <DsInput
                label="Telefone / WhatsApp"
                type="tel"
                value={form.phone}
                onValueChange={(v) => set('phone', formatPhone(v))}
                readonly={!canEdit}
                placeholder="(00) 00000-0000"
                helper="Aparece no PDF do programa."
            />
        </div>
    );
}

export function AddressFields({ c }: { c: ClinicData }) {
    const { form, set, errors, canEdit } = c;
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
                <DsInput
                    label="CEP"
                    value={form.zipCode}
                    onValueChange={(v) =>
                        set(
                            'zipCode',
                            applyMask(v.replace(/\D/g, ''), '#####-###'),
                        )
                    }
                    readonly={!canEdit}
                    inputMode="numeric"
                    placeholder="00000-000"
                    state={errors.zipCode ? 'error' : 'default'}
                    helper={errors.zipCode}
                />
            </div>
            <div className="sm:col-span-3">
                <DsInput
                    label="Rua"
                    value={form.address}
                    onValueChange={(v) => set('address', v)}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-1">
                <DsInput
                    label="Número"
                    value={form.number}
                    onValueChange={(v) => set('number', v)}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-4">
                <DsInput
                    label="Cidade"
                    value={form.city}
                    onValueChange={(v) => set('city', v)}
                    readonly={!canEdit}
                />
            </div>
            <div className="sm:col-span-2">
                <DsFieldSelect
                    label="UF"
                    value={form.state}
                    onValueChange={(v) => set('state', String(v))}
                    options={UFS.map((u) => ({ value: u, label: u }))}
                    placeholder="UF"
                    disabled={!canEdit}
                />
            </div>
        </div>
    );
}
