import { Check, Circle, Mail, Phone } from 'lucide-react';
import { useState } from 'react';

import { DsButton, dsCn, DsCollapse, DsInput } from '@/components/ds';
import { PatientStatusBadge } from '@/pages/clinic/patient/patient-list/patient-status';

import {
    AddressFields,
    ageFromIso,
    AvatarPreview,
    ContactFields,
    DiagnosisField,
    IdentityFields,
    InsuranceFields,
    PageHeader,
    PhotoField,
    ProfileFields,
    REQUIRED_FIELDS,
    SECTION_FIELDS,
    SourceFields,
    StatusField,
    type PrototypeState,
    type SectionKey,
} from './shared';

const REQUIRED_LABELS: Record<string, string> = {
    name: 'Nome',
    cpf: 'Documento',
    birth_date: 'Nascimento',
    phone: 'Celular',
    email: 'E-mail',
};

/**
 * D — Cadastro rápido: só o essencial à vista (o que a API exige + diagnóstico)
 * e o resto recolhido em "Mais informações". À direita, uma prévia ao vivo
 * do cartão do paciente na lista e o checklist dos obrigatórios.
 */
export function VariantD({ state }: { state: PrototypeState }) {
    const { form } = state;
    const { errors } = form.formState;
    const v = form.watch();
    const [open, setOpen] = useState<string | null>(null);
    const age = ageFromIso(v.birth_date);

    const filledIn = (section: SectionKey) =>
        SECTION_FIELDS[section].filter((f) => {
            const value = v[f];
            return typeof value === 'string'
                ? value.trim() !== ''
                : value === true;
        }).length;
    const titleWithCount = (title: string, section: SectionKey) => {
        const n = filledIn(section);
        return n > 0
            ? `${title} · ${n} preenchido${n === 1 ? '' : 's'}`
            : title;
    };

    return (
        <form
            noValidate
            onSubmit={state.submit()}
            className="px-4 py-6 sm:px-6 sm:py-8"
        >
            <div className="mx-auto flex max-w-6xl flex-col gap-6">
                <PageHeader
                    state={state}
                    subtitle="O essencial agora; o resto quando quiser."
                />
                <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="flex min-w-0 flex-col gap-6">
                        <section
                            aria-label="Dados essenciais"
                            className="@container flex flex-col gap-5 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs sm:p-7"
                        >
                            <PhotoField state={state} size={72} />
                            <IdentityFields form={form} showNickname={false} />
                            <ContactFields form={form} />
                            <StatusField form={form} as="radio" />
                            <DiagnosisField form={form} />
                        </section>

                        <section
                            aria-label="Mais informações"
                            className="@container"
                        >
                            <h2 className="mb-3 text-ds-body-sm font-semibold text-ds-content-secondary">
                                Mais informações{' '}
                                <span className="font-normal text-ds-content-muted">
                                    (opcional)
                                </span>
                            </h2>
                            <DsCollapse
                                value={open}
                                onValueChange={setOpen}
                                items={[
                                    {
                                        key: 'perfil',
                                        title: titleWithCount(
                                            'Perfil',
                                            'perfil',
                                        ),
                                        subtitle:
                                            'Apelido, estado civil, profissão, sexo, gênero',
                                        content: (
                                            <div className="flex flex-col gap-5 pt-2">
                                                <DsInput
                                                    label="Apelido"
                                                    {...form.register(
                                                        'apelido',
                                                    )}
                                                />
                                                <ProfileFields
                                                    form={form}
                                                    showDiagnosis={false}
                                                />
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'endereco',
                                        title: titleWithCount(
                                            'Endereço',
                                            'endereco',
                                        ),
                                        subtitle: 'O CEP preenche o resto',
                                        content: (
                                            <div className="pt-2">
                                                <AddressFields form={form} />
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'convenio',
                                        title: titleWithCount(
                                            'Convênio',
                                            'convenio',
                                        ),
                                        content: (
                                            <div className="pt-2">
                                                <InsuranceFields form={form} />
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'origem',
                                        title: titleWithCount(
                                            'Como conheceu',
                                            'origem',
                                        ),
                                        content: (
                                            <div className="pt-2">
                                                <SourceFields form={form} />
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        </section>

                        <div className="flex items-center gap-3">
                            <DsButton
                                variant="tertiary"
                                label="Cancelar"
                                onClick={state.cancel}
                            />
                            <div className="ml-auto">
                                <DsButton
                                    type="submit"
                                    size="lg"
                                    label="Cadastrar paciente"
                                />
                            </div>
                        </div>
                    </div>

                    <aside className="sticky top-6 hidden flex-col gap-4 lg:flex">
                        <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                            Prévia na lista
                        </p>
                        <div className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                            <AvatarPreview state={state} size={44} />
                            <div>
                                <p className="truncate text-ds-body-sm font-semibold">
                                    {v.name || (
                                        <span className="text-ds-content-subtle">
                                            Nome do paciente
                                        </span>
                                    )}
                                </p>
                                <p className="text-ds-caption text-ds-content-muted">
                                    {age !== null ? `${age} anos` : '— anos'}
                                    {v.profession ? ` · ${v.profession}` : ''}
                                </p>
                            </div>
                            <div className="self-start">
                                <PatientStatusBadge status={v.status} />
                            </div>
                            <div className="flex flex-col gap-1.5 text-ds-caption text-ds-content-secondary">
                                <span className="flex items-center gap-2">
                                    <Phone className="size-3.5" />
                                    {v.phone || '—'}
                                </span>
                                <span className="flex items-center gap-2 truncate">
                                    <Mail className="size-3.5" />
                                    {v.email || '—'}
                                </span>
                            </div>
                        </div>
                        <ul className="flex flex-col gap-2 rounded-ds-xl bg-ds-surface-subtle p-4">
                            {REQUIRED_FIELDS.map((f) => {
                                const ok =
                                    String(v[f] ?? '').trim() !== '' &&
                                    !errors[f];
                                return (
                                    <li
                                        key={f}
                                        className={dsCn(
                                            'flex items-center gap-2 text-ds-body-xs',
                                            ok
                                                ? 'text-ds-status-success-content'
                                                : errors[f]
                                                  ? 'text-ds-status-danger-content'
                                                  : 'text-ds-content-muted',
                                        )}
                                    >
                                        {ok ? (
                                            <Check className="size-4" />
                                        ) : (
                                            <Circle className="size-4" />
                                        )}
                                        {REQUIRED_LABELS[f]}
                                    </li>
                                );
                            })}
                        </ul>
                    </aside>
                </div>
            </div>
        </form>
    );
}
