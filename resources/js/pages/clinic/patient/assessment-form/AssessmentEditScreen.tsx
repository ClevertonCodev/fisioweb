/**
 * Ficha e laudo C: formulário de um lado, folha do outro. Assinada,
 * a tela vira só a folha. No celular, Preencher e Laudo em abas.
 */
import { PenTool, Save } from 'lucide-react';
import { useState } from 'react';

import { DsButton, dsCn, DsTabs } from '@/components/ds';
import type { AssessmentField } from '@/domain/clinic';

import { AnswerHeader, FieldBlock, SignedBanner } from './parts';
import { answerText, type AnswerState } from './shared';

function age(birth?: string) {
    if (!birth) return null;
    const b = new Date(birth);
    const now = new Date();
    let years = now.getFullYear() - b.getFullYear();
    if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate()))
        years -= 1;
    return years;
}

function ScaleDots({ s, f }: { s: AnswerState; f: AssessmentField }) {
    const min = f.config?.min ?? 0;
    const max = f.config?.max ?? 10;
    const v = Number(s.values[f.id]);
    if (max - min > 10 || Number.isNaN(v) || s.values[f.id] === '') return null;
    return (
        <span className="ml-2 inline-flex gap-0.5 align-middle" aria-hidden>
            {Array.from({ length: max - min + 1 }, (_, i) => (
                <span
                    key={i}
                    className={dsCn(
                        'size-1.5 rounded-ds-full',
                        min + i <= v
                            ? 'bg-ds-content-primary'
                            : 'bg-ds-border-default',
                    )}
                />
            ))}
        </span>
    );
}

function Sheet({ s }: { s: AnswerState }) {
    const a = s.assessment;
    const years = age(s.patient?.birthDate);
    const date = a?.signedAt ? new Date(a.signedAt) : new Date();
    return (
        <article
            aria-label="Laudo da avaliação"
            className="mx-auto w-full max-w-[640px] rounded-ds-md border border-ds-border-subtle bg-ds-white p-6 text-ds-gray-100 shadow-ds-md sm:p-10"
        >
            <header className="flex items-start justify-between gap-4 border-b-2 border-ds-gray-100 pb-3">
                <div>
                    <p className="text-ds-micro tracking-widest uppercase">
                        Avaliação fisioterapêutica
                    </p>
                    <h2 className="text-ds-body-lg leading-tight font-semibold">
                        {a?.template.name}
                    </h2>
                </div>
                <p className="text-right font-ds-mono text-ds-caption">
                    Nº {String(a?.id ?? '').padStart(5, '0')}
                    <br />
                    {date.toLocaleDateString('pt-BR')}
                </p>
            </header>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-b border-ds-gray-30 py-3 text-ds-caption">
                <div className="col-span-2">
                    <dt className="inline text-ds-gray-60">Paciente: </dt>
                    <dd className="inline font-medium">{s.patient?.name}</dd>
                </div>
                {years != null && (
                    <div>
                        <dt className="inline text-ds-gray-60">Idade: </dt>
                        <dd className="inline">{years} anos</dd>
                    </div>
                )}
                {s.patient?.diagnosis && (
                    <div className="col-span-2">
                        <dt className="inline text-ds-gray-60">
                            Diagnóstico:{' '}
                        </dt>
                        <dd className="inline">{s.patient.diagnosis}</dd>
                    </div>
                )}
            </dl>

            {s.sections.map((sec) => {
                const filled = sec.fields.filter((f) => answerText(s, f));
                return (
                    <section key={sec.id} className="pt-4">
                        <h3 className="mb-1.5 text-ds-micro font-semibold tracking-wider uppercase">
                            {sec.title}
                        </h3>
                        {filled.length === 0 ? (
                            <p className="text-ds-caption text-ds-gray-50 italic">
                                Sem respostas nesta seção.
                            </p>
                        ) : (
                            <dl className="flex flex-col gap-1 text-ds-caption leading-relaxed">
                                {filled.map((f) => (
                                    <div key={f.id}>
                                        <dt className="inline text-ds-gray-60">
                                            {f.label}:{' '}
                                        </dt>
                                        <dd className="inline whitespace-pre-line">
                                            {answerText(s, f)}
                                            {f.fieldType === 'range' && (
                                                <ScaleDots s={s} f={f} />
                                            )}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </section>
                );
            })}

            <footer className="mt-10 flex flex-col items-center gap-1 text-ds-caption">
                <span className="h-px w-56 bg-ds-gray-100" />
                <span className="font-medium">
                    {a?.clinicUser?.name ?? 'Fisioterapeuta responsável'}
                </span>
                <span className="text-ds-gray-60">
                    {s.readOnly
                        ? `Assinado em ${date.toLocaleDateString('pt-BR')}`
                        : 'Aguardando assinatura'}
                </span>
            </footer>
        </article>
    );
}

export function AssessmentEditScreen({ s }: { s: AnswerState }) {
    const [pane, setPane] = useState('form');

    if (s.readOnly) {
        return (
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="mx-auto flex w-full max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-6 lg:px-8">
                    <AnswerHeader s={s}>
                        <SignedBanner s={s} />
                    </AnswerHeader>
                    <div className="pb-6">
                        <Sheet s={s} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="border-b border-ds-border-subtle bg-ds-surface-default px-4 py-4 lg:px-8">
                <div className="mx-auto w-full max-w-(--breakpoint-ds-xl)">
                    <AnswerHeader s={s}>
                        <SignedBanner s={s} />
                    </AnswerHeader>
                    <div className="mt-3 lg:hidden">
                        <DsTabs
                            size="sm"
                            value={pane}
                            onValueChange={setPane}
                            tabs={[
                                { key: 'form', label: 'Preencher' },
                                { key: 'sheet', label: 'Laudo' },
                            ]}
                        />
                    </div>
                </div>
            </div>
            <div className="mx-auto grid min-h-0 w-full max-w-(--breakpoint-ds-xl) flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div
                    className={dsCn(
                        'min-w-0 overflow-y-auto px-4 py-5 lg:block lg:px-8',
                        pane === 'form' ? 'block' : 'hidden',
                    )}
                >
                    <div className="flex flex-col gap-6">
                        {s.sections.map((sec) => (
                            <section
                                key={sec.id}
                                className="flex flex-col gap-4"
                            >
                                <h2 className="border-b border-ds-border-subtle pb-1.5 text-ds-eyebrow text-ds-content-muted uppercase">
                                    {sec.title}
                                </h2>
                                {sec.fields.map((f) => (
                                    <FieldBlock key={f.id} s={s} field={f} />
                                ))}
                            </section>
                        ))}
                    </div>
                </div>
                <div
                    className={dsCn(
                        'min-w-0 overflow-y-auto border-ds-border-subtle bg-ds-surface-subtle px-4 py-6 lg:block lg:border-l lg:px-8',
                        pane === 'sheet' ? 'block' : 'hidden',
                    )}
                >
                    <Sheet s={s} />
                </div>
            </div>
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ds-border-subtle bg-ds-surface-default px-4 py-3 lg:px-8">
                <span className="mr-auto font-ds-mono text-ds-caption text-ds-content-secondary">
                    {s.missing.length
                        ? `${s.missing.length} obrigatória(s) sem resposta`
                        : 'Pronta para assinar'}
                </span>
                <DsButton
                    variant="secondary"
                    iconPosition="left"
                    icon={<Save />}
                    label={
                        s.saving && !s.signing
                            ? 'Salvando...'
                            : 'Salvar rascunho'
                    }
                    disabled={s.saving || s.signing}
                    onClick={s.saveDraft}
                />
                <DsButton
                    iconPosition="left"
                    icon={<PenTool />}
                    label={s.signing ? 'Assinando...' : 'Assinar'}
                    disabled={s.saving || s.signing}
                    onClick={() => s.sign()}
                />
            </footer>
        </div>
    );
}
