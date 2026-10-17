import { Check, CircleAlert } from 'lucide-react';
import { useState } from 'react';

import { DsButton, dsCn, DsTabs } from '@/components/ds';

import { PhotoUpload } from './PhotoUpload';
import {
    ageFromIso,
    firstSectionWithError,
    IdentityFields,
    PageHeader,
    pendingRequired,
    REQUIRED_FIELDS,
    SECTION_FIELDS,
    sectionErrorCount,
    SectionFields,
    SECTIONS,
    SectionTitle,
    StatusField,
    type PrototypeState,
    type SectionKey,
} from './shared';

const REQUIRED_LABELS: Record<string, string> = {
    name: 'Nome',
    cpf: 'Documento',
    birth_date: 'Data de nascimento',
    phone: 'Celular',
    email: 'E-mail',
};

/**
 * A — Abas, na largura toda (até 1920px). À esquerda, um painel fixo com a
 * foto (recorte), a situação e o que falta dos obrigatórios; à direita, o
 * cartão com as abas, com os campos em mais colunas conforme o espaço.
 */
export function VariantA({ state }: { state: PrototypeState }) {
    const { form } = state;
    const [tab, setTab] = useState<SectionKey>('identificacao');
    const { errors } = form.formState;
    const v = form.watch();
    const index = SECTIONS.findIndex((s) => s.key === tab);
    const current = SECTIONS[index];
    const age = ageFromIso(v.birth_date);
    // Obrigatórios vazios ou inválidos: travam "Próxima aba" (os da aba) e
    // "Concluir cadastro" (todos).
    const pending = pendingRequired(v);
    const pendingInTab = pending.filter((f) => SECTION_FIELDS[tab].includes(f));

    const onSubmit = state.submit((errs) => {
        const first = firstSectionWithError(errs);
        if (first) setTab(first);
    });

    return (
        <form
            noValidate
            onSubmit={onSubmit}
            className="flex min-h-full flex-col"
        >
            <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
                {/* Largura máxima = breakpoint xl do DS (1920px). */}
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                    <PageHeader state={state} />
                    <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr] 2xl:grid-cols-[340px_1fr]">
                        <aside
                            aria-label="Foto e situação"
                            className="flex flex-col gap-6 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-6 shadow-ds-xs lg:sticky lg:top-6"
                        >
                            <PhotoUpload
                                value={state.photo}
                                onChange={state.setPhoto}
                                name={v.name}
                            />
                            <div className="text-center">
                                <p className="truncate text-ds-h4">
                                    {v.name.trim() || (
                                        <span className="text-ds-content-subtle">
                                            Novo paciente
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 text-ds-caption text-ds-content-muted">
                                    {age !== null
                                        ? `${age} ${age === 1 ? 'ano' : 'anos'}`
                                        : 'Idade aparece com a data de nascimento'}
                                </p>
                            </div>
                            <StatusField form={form} />
                            <div className="flex flex-col gap-2 border-t border-ds-border-subtle pt-5">
                                <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                                    Obrigatórios
                                </p>
                                <ul className="flex flex-col gap-1.5">
                                    {REQUIRED_FIELDS.map((f) => {
                                        const ok = !pending.includes(f);
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
                                                {errors[f] ? (
                                                    <CircleAlert className="size-4" />
                                                ) : (
                                                    <Check
                                                        className={dsCn(
                                                            'size-4',
                                                            !ok && 'opacity-30',
                                                        )}
                                                    />
                                                )}
                                                {REQUIRED_LABELS[f]}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </aside>

                        <div className="min-w-0 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
                            <div className="border-b border-ds-border-subtle p-3">
                                <DsTabs
                                    aria-label="Seções do cadastro"
                                    tabs={SECTIONS.map((s) => ({
                                        key: s.key,
                                        label: s.label,
                                        icon:
                                            sectionErrorCount(s.key, errors) >
                                            0 ? (
                                                <CircleAlert className="text-ds-status-danger-content" />
                                            ) : undefined,
                                    }))}
                                    value={tab}
                                    onValueChange={(k) =>
                                        setTab(k as SectionKey)
                                    }
                                />
                            </div>
                            <div className="@container p-5 sm:p-8">
                                {current && (
                                    <SectionTitle
                                        title={current.label}
                                        description={current.hint}
                                    />
                                )}
                                {/* Todas montadas: o RHF valida e guarda tudo. */}
                                {SECTIONS.map((s) => (
                                    <div key={s.key} hidden={s.key !== tab}>
                                        {s.key === 'identificacao' ? (
                                            <IdentityFields form={form} />
                                        ) : (
                                            <SectionFields
                                                section={s.key}
                                                state={state}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="sticky bottom-0 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-wrap items-center gap-3">
                    <p
                        aria-live="polite"
                        className="mr-auto text-ds-caption text-ds-content-muted"
                    >
                        {pending.length === 0 ? (
                            <span className="text-ds-status-success-content">
                                Tudo pronto para concluir.
                            </span>
                        ) : (
                            <>
                                Falta preencher:{' '}
                                {pending
                                    .map((f) => REQUIRED_LABELS[f])
                                    .join(', ')}
                            </>
                        )}
                    </p>
                    {/* Todas as ações juntas, à direita. */}
                    <div className="flex gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={state.cancel}
                        />
                        {index < SECTIONS.length - 1 && (
                            <DsButton
                                variant="secondary"
                                label="Próxima aba"
                                disabled={pendingInTab.length > 0}
                                onClick={() => {
                                    const next = SECTIONS[index + 1];
                                    if (next) setTab(next.key);
                                }}
                            />
                        )}
                        <DsButton
                            type="submit"
                            label="Concluir cadastro"
                            disabled={pending.length > 0}
                        />
                    </div>
                </div>
            </footer>
        </form>
    );
}
