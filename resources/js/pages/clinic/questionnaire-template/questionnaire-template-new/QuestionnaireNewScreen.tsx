/** Novo questionário v2 — Banco de perguntas (variante C do protótipo). */
import { ArrowLeft, Check, Plus } from 'lucide-react';
import { useState } from 'react';

import {
    DsAlert,
    DsBadge,
    DsButton,
    dsCn,
    DsEmptyState,
    DsInput,
    DsTextarea,
} from '@/components/ds';

import { QuestionEditor, TYPE_ICON } from './parts';
import {
    BANK,
    fromBank,
    numbering,
    TYPE_LABEL,
    type QuestionnaireBuilder,
} from './shared';

export function QuestionnaireNewScreen({ b }: { b: QuestionnaireBuilder }) {
    const [selected, setSelected] = useState<string | null>(null);
    const target = b.sections[b.sections.length - 1];
    const used = new Set(
        b.sections.flatMap((s) => s.questions.map((q) => q.label)),
    );
    const groups = [...new Set(BANK.map((i) => i.group))];

    const where = b.sections
        .flatMap((s) => s.questions.map((q, qi) => ({ s, q, qi })))
        .find((x) => x.q._key === selected);
    const num = numbering(b.sections);

    return (
        <div className="flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
            <header className="flex flex-wrap items-center gap-3 border-b border-ds-border-subtle bg-ds-surface-default px-4 py-3 sm:px-6">
                <DsButton
                    variant="tertiary"
                    iconPosition="only"
                    icon={<ArrowLeft />}
                    label="Voltar"
                    onClick={b.back}
                />
                <h1 className="mr-auto text-ds-body-lg font-semibold">
                    Novo questionário
                </h1>
                <DsButton
                    label="Salvar questionário"
                    loading={b.saving}
                    disabled={b.saving}
                    onClick={() => void b.save()}
                />
            </header>
            {b.error && (
                <div className="px-4 pt-3 sm:px-6">
                    <DsAlert variant="danger" title="Falta pouco">
                        {b.error}
                    </DsAlert>
                </div>
            )}

            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[280px_minmax(0,1fr)_380px] lg:overflow-hidden">
                {/* Banco */}
                <aside
                    aria-label="Banco de perguntas"
                    className="border-ds-border-subtle bg-ds-surface-default p-4 lg:overflow-y-auto lg:border-r"
                >
                    <p className="mb-1 text-ds-body-sm font-semibold">
                        Banco de perguntas
                    </p>
                    <p className="mb-4 text-ds-caption text-ds-content-muted">
                        Toque no + para pôr no questionário.
                    </p>
                    {groups.map((g) => (
                        <div key={g} className="mb-4">
                            <p className="mb-2 text-ds-eyebrow text-ds-content-muted uppercase">
                                {g}
                            </p>
                            <ul className="flex flex-col gap-1.5">
                                {BANK.filter((i) => i.group === g).map((i) => {
                                    const Icon = TYPE_ICON[i.type];
                                    const on = used.has(i.label);
                                    return (
                                        <li key={i.key}>
                                            <button
                                                type="button"
                                                disabled={on || !target}
                                                onClick={() => {
                                                    if (!target) return;
                                                    const k = b.addQuestion(
                                                        target._key,
                                                        fromBank(i),
                                                    );
                                                    setSelected(k);
                                                }}
                                                className="flex w-full cursor-pointer items-start gap-2 rounded-ds-md border border-ds-border-subtle px-3 py-2 text-left text-ds-body-xs transition-colors hover:border-ds-border-brand-subtle disabled:cursor-default disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
                                            >
                                                <Icon className="mt-0.5 text-ds-content-muted" />
                                                <span className="flex-1">
                                                    {i.label}
                                                </span>
                                                {on ? (
                                                    <Check className="text-ds-status-success-content" />
                                                ) : (
                                                    <Plus className="text-ds-content-brand ds-dark:text-ds-primary-60" />
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </aside>

                {/* Roteiro */}
                <main className="flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:overflow-y-auto">
                    <DsInput
                        label="Título"
                        placeholder="Ex.: Primeira consulta, dor lombar"
                        value={b.title}
                        onValueChange={b.setTitle}
                    />
                    <DsTextarea
                        label="Descrição"
                        placeholder="Opcional"
                        value={b.description}
                        onValueChange={b.setDescription}
                        rows={3}
                    />
                    {b.sections.map((s) => (
                        <section
                            key={s._key}
                            className="overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
                        >
                            <div className="border-b border-ds-border-subtle bg-ds-surface-subtle px-3 py-2">
                                <DsInput
                                    size="sm"
                                    aria-label="Título da seção"
                                    placeholder="Título da seção"
                                    value={s.title}
                                    onValueChange={(title) =>
                                        b.updateSection(s._key, { title })
                                    }
                                />
                            </div>
                            {s.questions.length === 0 ? (
                                <p className="px-4 py-6 text-center text-ds-body-xs text-ds-content-muted">
                                    Escolha no banco ou crie uma pergunta.
                                </p>
                            ) : (
                                <ol className="divide-y divide-ds-border-subtle">
                                    {s.questions.map((q) => {
                                        const Icon = TYPE_ICON[q.type];
                                        const on = selected === q._key;
                                        return (
                                            <li key={q._key}>
                                                <button
                                                    type="button"
                                                    aria-current={
                                                        on || undefined
                                                    }
                                                    onClick={() =>
                                                        setSelected(q._key)
                                                    }
                                                    className={dsCn(
                                                        'flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors',
                                                        on
                                                            ? 'bg-ds-surface-brand-subtle'
                                                            : 'hover:bg-ds-surface-subtle',
                                                    )}
                                                >
                                                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                                        {num.get(q._key)}
                                                    </span>
                                                    <Icon className="size-4 shrink-0 text-ds-content-muted" />
                                                    <span
                                                        className={dsCn(
                                                            'flex-1 truncate text-ds-body-xs',
                                                            !q.label &&
                                                                'text-ds-content-muted italic',
                                                        )}
                                                    >
                                                        {q.label ||
                                                            'Pergunta sem texto'}
                                                    </span>
                                                    <span className="hidden text-ds-caption text-ds-content-muted sm:inline">
                                                        {TYPE_LABEL[q.type]}
                                                    </span>
                                                    {q.required && (
                                                        <DsBadge variant="warning">
                                                            Obrigatória
                                                        </DsBadge>
                                                    )}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ol>
                            )}
                            <div className="border-t border-ds-border-subtle p-2">
                                <DsButton
                                    size="sm"
                                    variant="tertiary"
                                    iconPosition="left"
                                    icon={<Plus />}
                                    label="Pergunta em branco"
                                    onClick={() =>
                                        setSelected(b.addQuestion(s._key))
                                    }
                                />
                            </div>
                        </section>
                    ))}
                    <div>
                        <DsButton
                            variant="tertiary"
                            iconPosition="left"
                            icon={<Plus />}
                            label="Nova seção"
                            onClick={() => b.addSection()}
                        />
                    </div>
                </main>

                {/* Pergunta */}
                <aside
                    aria-label="Pergunta escolhida"
                    className="border-ds-border-subtle bg-ds-surface-default p-4 sm:p-6 lg:overflow-y-auto lg:border-l"
                >
                    {where ? (
                        <QuestionEditor
                            key={where.q._key}
                            q={where.q}
                            index={b.sections
                                .flatMap((s) => s.questions)
                                .findIndex((q) => q._key === where.q._key)}
                            canUp={where.qi > 0}
                            canDown={where.qi < where.s.questions.length - 1}
                            onChange={(patch) =>
                                b.updateQuestion(
                                    where.s._key,
                                    where.q._key,
                                    patch,
                                )
                            }
                            onMove={(d) =>
                                b.moveQuestion(where.s._key, where.q._key, d)
                            }
                            onDuplicate={() =>
                                b.duplicateQuestion(where.s._key, where.q._key)
                            }
                            onRemove={() => {
                                b.removeQuestion(where.s._key, where.q._key);
                                setSelected(null);
                            }}
                        />
                    ) : (
                        <DsEmptyState
                            variant="empty"
                            title="Nenhuma pergunta escolhida"
                            description="Toque numa pergunta do roteiro para ajustar o texto, o tipo e as opções."
                        />
                    )}
                </aside>
            </div>
        </div>
    );
}
