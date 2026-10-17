import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { useState } from 'react';

import type { PatientFormValues } from '@/application/clinic';
import { DsButton, DsSteps, formatNationalPhone } from '@/components/ds';

import {
    AddressFields,
    ageFromIso,
    ContactFields,
    IdentityFields,
    InsuranceFields,
    LABELS,
    optionLabel,
    PageHeader,
    PhotoField,
    ProfileFields,
    SECTION_FIELDS,
    SectionTitle,
    SourceFields,
    StatusField,
    type PrototypeState,
} from './shared';

type FieldName = keyof PatientFormValues;

const STEPS: { label: string; description: string; fields: FieldName[] }[] = [
    {
        label: 'Quem é',
        description: 'Identificação',
        fields: SECTION_FIELDS.identificacao,
    },
    {
        label: 'Contato',
        description: 'Telefone e endereço',
        fields: [...SECTION_FIELDS.contato, ...SECTION_FIELDS.endereco],
    },
    {
        label: 'Complementos',
        description: 'Perfil, convênio, origem',
        fields: [
            ...SECTION_FIELDS.perfil,
            ...SECTION_FIELDS.convenio,
            ...SECTION_FIELDS.origem,
        ],
    },
    { label: 'Revisão', description: 'Confira e conclua', fields: [] },
];

function Summary({
    state,
    goTo,
}: {
    state: PrototypeState;
    goTo: (step: number) => void;
}) {
    const v = state.form.watch();
    const age = ageFromIso(v.birth_date);
    const address = [
        v.address_street,
        v.address_no_number ? 'S/N' : v.address_number,
        v.address_complement,
        v.neighborhood,
        v.city && v.state ? `${v.city}/${v.state}` : v.city,
    ]
        .filter(Boolean)
        .join(', ');

    const blocks: { title: string; step: number; rows: [string, string][] }[] =
        [
            {
                title: 'Identificação',
                step: 0,
                rows: [
                    ['Nome', v.name + (v.apelido ? ` (${v.apelido})` : '')],
                    [v.is_foreign ? 'Documento' : 'CPF', v.cpf],
                    [
                        'Nascimento',
                        v.birth_date
                            ? `${v.birth_date.split('-').reverse().join('/')} · ${age} anos`
                            : '',
                    ],
                    ['Situação', optionLabel(LABELS.status, v.status) ?? ''],
                ],
            },
            {
                title: 'Contato',
                step: 1,
                rows: [
                    ['Celular', formatNationalPhone(v.phone)],
                    ['E-mail', v.email],
                    ['Endereço', address],
                ],
            },
            {
                title: 'Complementos',
                step: 2,
                rows: [
                    ['Diagnóstico', v.diagnosis],
                    ['Profissão', v.profession],
                    [
                        'Convênio',
                        v.has_insurance
                            ? [v.insurance, v.insurance_number]
                                  .filter(Boolean)
                                  .join(' · ') || 'Sim'
                            : 'Particular',
                    ],
                    [
                        'Como conheceu',
                        optionLabel(LABELS.source, v.referral_source) ?? '',
                    ],
                ],
            },
        ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-ds-lg bg-ds-surface-subtle p-4">
                <PhotoField state={state} size={64} />
            </div>
            {blocks.map((b) => (
                <section
                    key={b.title}
                    className="rounded-ds-lg border border-ds-border-subtle p-4"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-ds-body-sm font-semibold">
                            {b.title}
                        </h3>
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="left"
                            icon={<Pencil />}
                            label="Editar"
                            onClick={() => goTo(b.step)}
                        />
                    </div>
                    <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[140px_1fr]">
                        {b.rows.map(([label, value]) => (
                            <div key={label} className="contents">
                                <dt className="text-ds-caption text-ds-content-muted">
                                    {label}
                                </dt>
                                <dd className="text-ds-body-xs text-ds-content-primary">
                                    {value || (
                                        <span className="text-ds-content-subtle">
                                            —
                                        </span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>
            ))}
        </div>
    );
}

/**
 * C — Assistente em etapas: uma pergunta de cada vez. "Continuar" valida só a
 * etapa; a última etapa é uma revisão com "Editar" em cada bloco.
 */
export function VariantC({ state }: { state: PrototypeState }) {
    const { form } = state;
    const [step, setStepState] = useState(0);
    const setStep = (next: number | ((s: number) => number)) => {
        setStepState(next);
        document
            .querySelector('[data-prototype-variant]')
            ?.scrollTo({ top: 0 });
    };
    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    const next = async () => {
        const ok = await form.trigger(current?.fields ?? []);
        if (ok) setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const onSubmit = state.submit((errs) => {
        const withError = STEPS.findIndex((s) =>
            s.fields.some((f) => !!errs[f]),
        );
        if (withError >= 0) setStep(withError);
    });

    return (
        <form
            noValidate
            onSubmit={(e) => {
                // Enter num campo avança a etapa em vez de enviar.
                if (!isLast) {
                    e.preventDefault();
                    void next();
                    return;
                }
                void onSubmit(e);
            }}
            className="px-4 py-6 sm:px-6 sm:py-8"
        >
            <div className="mx-auto flex max-w-2xl flex-col gap-6">
                <PageHeader
                    state={state}
                    subtitle={`Etapa ${step + 1} de ${STEPS.length}`}
                />
                <DsSteps
                    steps={STEPS.map((s) => ({
                        label: s.label,
                        description: s.description,
                    }))}
                    current={step}
                />
                <div className="@container rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs sm:p-8">
                    {step === 0 && (
                        <div className="flex flex-col gap-6">
                            <PhotoField state={state} layout="stack" />
                            <IdentityFields form={form} />
                            <StatusField form={form} as="radio" />
                        </div>
                    )}
                    {step === 1 && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <SectionTitle
                                    title="Como falar com o paciente"
                                    description="O celular recebe os lembretes pelo WhatsApp."
                                />
                                <ContactFields form={form} />
                            </div>
                            <div>
                                <SectionTitle
                                    title="Endereço"
                                    description="Opcional. Digite o CEP e o resto se preenche."
                                />
                                <AddressFields form={form} />
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="flex flex-col gap-8">
                            <div>
                                <SectionTitle
                                    title="Perfil e diagnóstico"
                                    description="Tudo opcional."
                                />
                                <ProfileFields form={form} />
                            </div>
                            <div>
                                <SectionTitle title="Convênio" />
                                <InsuranceFields form={form} />
                            </div>
                            <div>
                                <SectionTitle title="Como conheceu" />
                                <SourceFields form={form} />
                            </div>
                        </div>
                    )}
                    {isLast && <Summary state={state} goTo={setStep} />}
                </div>
                <div className="flex items-center gap-3">
                    {step === 0 ? (
                        <DsButton
                            variant="tertiary"
                            label="Cancelar"
                            onClick={state.cancel}
                        />
                    ) : (
                        <DsButton
                            variant="secondary"
                            iconPosition="left"
                            icon={<ArrowLeft />}
                            label="Voltar"
                            onClick={() => setStep((s) => s - 1)}
                        />
                    )}
                    <div className="ml-auto flex gap-3">
                        {step === 2 && (
                            <DsButton
                                variant="tertiary"
                                label="Pular"
                                onClick={() => setStep(3)}
                            />
                        )}
                        {isLast ? (
                            <DsButton type="submit" label="Concluir cadastro" />
                        ) : (
                            <DsButton
                                iconPosition="right"
                                icon={<ArrowRight />}
                                label="Continuar"
                                onClick={() => void next()}
                            />
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
