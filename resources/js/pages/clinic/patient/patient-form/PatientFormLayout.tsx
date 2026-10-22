import { ArrowLeft, Check, CircleAlert } from 'lucide-react';
import { useState } from 'react';

import { patientDisplayName } from '@/application/clinic/patient-display-name';
import {
    getPatientPhotoSourceError,
    getPatientPhotoValidationError,
    PATIENT_PHOTO_INPUT_ACCEPT,
} from '@/application/clinic/patient-photo-rules';
import { DsAvatarPhotoField, DsButton, dsCn, DsTabs } from '@/components/ds';

import {
    IdentityFields,
    SectionFields,
    SectionTitle,
    StatusField,
} from './fields';
import {
    ageFromIso,
    firstSectionWithError,
    pendingRequired,
    REQUIRED_FIELDS,
    REQUIRED_LABELS,
    SECTION_FIELDS,
    sectionErrorCount,
    SECTIONS,
    type PatientFormState,
    type SectionKey,
} from './form';

export function PatientFormLayout({ f }: { f: PatientFormState }) {
    const { form } = f;
    const creating = f.mode === 'create';
    const [tab, setTab] = useState<SectionKey>('identificacao');
    const { errors } = form.formState;
    const v = form.watch();
    const index = SECTIONS.findIndex((s) => s.key === tab);
    const current = SECTIONS[index];
    const age = ageFromIso(v.birth_date);
    const shownName = patientDisplayName({
        name: v.name,
        apelido: v.apelido,
        useApelido: v.use_apelido,
    });
    const pending = pendingRequired(v);
    const pendingInTab = pending.filter((field) =>
        SECTION_FIELDS[tab].includes(field),
    );

    const onSubmit = f.submit((errs) => {
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
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                    <header className="flex flex-wrap items-start gap-4">
                        <DsButton
                            variant="tertiary"
                            iconPosition="only"
                            icon={<ArrowLeft />}
                            label={
                                creating
                                    ? 'Voltar para pacientes'
                                    : 'Voltar para o prontuário'
                            }
                            onClick={f.cancel}
                        />
                        <div className="mr-auto min-w-0">
                            <h1 className="text-ds-page-title">
                                {creating ? 'Novo paciente' : 'Editar paciente'}
                            </h1>
                            <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                                {creating
                                    ? 'Preencha os dados do paciente. Campos com * são obrigatórios.'
                                    : 'Atualize as informações do paciente e salve as alterações.'}
                            </p>
                        </div>
                    </header>
                    <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr] 2xl:grid-cols-[340px_1fr]">
                        <aside
                            aria-label="Foto e situação"
                            className="flex flex-col gap-6 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-6 shadow-ds-xs max-lg:order-2 lg:sticky lg:top-6"
                        >
                            <DsAvatarPhotoField
                                value={f.photoFile}
                                currentUrl={f.savedPhoto}
                                onChange={f.setPhoto}
                                name={shownName}
                                accept={PATIENT_PHOTO_INPUT_ACCEPT}
                                validateSource={getPatientPhotoSourceError}
                                validateResult={getPatientPhotoValidationError}
                            />
                            <div className="text-center">
                                <p className="truncate text-ds-h4">
                                    {shownName || (
                                        <span className="text-ds-content-subtle">
                                            {creating
                                                ? 'Novo paciente'
                                                : 'Paciente'}
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 text-ds-caption text-ds-content-muted">
                                    {age !== null
                                        ? `${age} ${age === 1 ? 'ano' : 'anos'}`
                                        : 'Idade aparece com a data de nascimento'}
                                </p>
                            </div>
                            <StatusField
                                form={form}
                                options={f.statusOptions}
                            />
                            <div className="flex flex-col gap-2 border-t border-ds-border-subtle pt-5">
                                <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                                    Obrigatórios
                                </p>
                                <ul className="flex flex-col gap-1.5">
                                    {REQUIRED_FIELDS.map((field) => {
                                        const ok = !pending.includes(field);
                                        return (
                                            <li
                                                key={field}
                                                className={dsCn(
                                                    'flex items-center gap-2 text-ds-body-xs',
                                                    ok
                                                        ? 'text-ds-status-success-content'
                                                        : errors[field]
                                                          ? 'text-ds-status-danger-content'
                                                          : 'text-ds-content-muted',
                                                )}
                                            >
                                                {errors[field] ? (
                                                    <CircleAlert className="size-4" />
                                                ) : (
                                                    <Check
                                                        className={dsCn(
                                                            'size-4',
                                                            !ok && 'opacity-30',
                                                        )}
                                                    />
                                                )}
                                                {REQUIRED_LABELS[field]}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </aside>

                        <div className="min-w-0 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs max-lg:order-1">
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
                                {SECTIONS.map((s) => (
                                    <div key={s.key} hidden={s.key !== tab}>
                                        {s.key === 'identificacao' ? (
                                            <IdentityFields form={form} />
                                        ) : (
                                            <SectionFields
                                                section={s.key}
                                                form={form}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="mt-auto border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 sm:px-6">
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-wrap items-center gap-3">
                    <p
                        aria-live="polite"
                        className="mr-auto text-ds-caption text-ds-content-muted"
                    >
                        {pending.length === 0 ? (
                            <span className="text-ds-status-success-content">
                                Tudo pronto para{' '}
                                {creating ? 'concluir' : 'salvar'}.
                            </span>
                        ) : (
                            <>
                                Falta preencher:{' '}
                                {pending
                                    .map((field) => REQUIRED_LABELS[field])
                                    .join(', ')}
                            </>
                        )}
                    </p>
                    <div className="flex gap-3">
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={f.cancel}
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
                            label={
                                f.submitting
                                    ? creating
                                        ? 'Criando…'
                                        : 'Salvando…'
                                    : creating
                                      ? 'Concluir cadastro'
                                      : 'Salvar alterações'
                            }
                            loading={f.submitting}
                            disabled={pending.length > 0 || f.submitting}
                        />
                    </div>
                </div>
            </footer>
        </form>
    );
}
