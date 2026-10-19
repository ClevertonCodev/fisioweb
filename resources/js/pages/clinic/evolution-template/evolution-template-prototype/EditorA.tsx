/**
 * PROTÓTIPO A, "Montar e ver ao vivo": seções em cartões, cada item numa
 * linha (nome no botão, texto que vai para o prontuário e se pede
 * complemento). Ao lado, o modelo funcionando: tocar nos itens monta o
 * texto como no prontuário. Os problemas aparecem ao lado do "Salvar".
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { DsButton, DsInput, DsSwitch, DsTextarea } from '@/components/ds';

import { TryTemplate } from './parts';
import type { TemplateDraft } from './shared';

export function EditorA({ d }: { d: TemplateDraft }) {
    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="flex min-w-0 flex-col gap-4">
                <section className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs">
                    <DsInput
                        label="Nome do modelo"
                        placeholder="Ex.: Pós-operatório de joelho"
                        value={d.name}
                        onValueChange={d.setName}
                    />
                    <DsTextarea
                        label="Para que serve (opcional)"
                        rows={2}
                        placeholder="Aparece para quem escolhe o modelo na evolução"
                        value={d.description}
                        onValueChange={d.setDescription}
                    />
                </section>

                {d.sections.map((s, si) => (
                    <section
                        key={s.key}
                        className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
                    >
                        <header className="flex items-center gap-2 border-b border-ds-border-subtle px-4 py-3">
                            <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                {si + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <DsInput
                                    size="sm"
                                    aria-label={`Título da seção ${si + 1}`}
                                    placeholder="Título da seção (ex.: Condutas)"
                                    value={s.title}
                                    onValueChange={(v) =>
                                        d.patchSection(s.key, { title: v })
                                    }
                                />
                            </div>
                            <DsButton
                                iconPosition="only"
                                size="sm"
                                variant="tertiary"
                                icon={<ArrowUp />}
                                tooltip="Subir seção"
                                disabled={si === 0}
                                onClick={() => d.moveSection(si, si - 1)}
                            />
                            <DsButton
                                iconPosition="only"
                                size="sm"
                                variant="tertiary"
                                icon={<ArrowDown />}
                                tooltip="Descer seção"
                                disabled={si === d.sections.length - 1}
                                onClick={() => d.moveSection(si, si + 1)}
                            />
                            <DsButton
                                iconPosition="only"
                                size="sm"
                                variant="destructive-tertiary"
                                icon={<Trash2 />}
                                tooltip="Remover seção"
                                onClick={() => d.removeSection(s.key)}
                            />
                        </header>
                        <ol className="flex flex-col divide-y divide-ds-border-subtle">
                            {s.items.map((it, ii) => (
                                <li
                                    key={it.key}
                                    className="flex flex-col gap-2 px-4 py-3"
                                >
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
                                        <DsInput
                                            size="sm"
                                            aria-label="Nome do item"
                                            placeholder="Nome no botão (ex.: Crioterapia)"
                                            value={it.label}
                                            onValueChange={(v) =>
                                                d.patchItem(s.key, it.key, {
                                                    label: v,
                                                })
                                            }
                                        />
                                        <DsInput
                                            size="sm"
                                            aria-label="Texto no prontuário"
                                            placeholder="Texto no prontuário (ex.: Realizada crioterapia.)"
                                            value={it.printText}
                                            onValueChange={(v) =>
                                                d.patchItem(s.key, it.key, {
                                                    printText: v,
                                                })
                                            }
                                        />
                                        <div className="flex items-center gap-0.5">
                                            <DsButton
                                                iconPosition="only"
                                                size="sm"
                                                variant="tertiary"
                                                icon={<ArrowUp />}
                                                tooltip="Subir"
                                                disabled={ii === 0}
                                                onClick={() =>
                                                    d.moveItem(
                                                        s.key,
                                                        ii,
                                                        ii - 1,
                                                    )
                                                }
                                            />
                                            <DsButton
                                                iconPosition="only"
                                                size="sm"
                                                variant="tertiary"
                                                icon={<ArrowDown />}
                                                tooltip="Descer"
                                                disabled={
                                                    ii === s.items.length - 1
                                                }
                                                onClick={() =>
                                                    d.moveItem(
                                                        s.key,
                                                        ii,
                                                        ii + 1,
                                                    )
                                                }
                                            />
                                            <DsButton
                                                iconPosition="only"
                                                size="sm"
                                                variant="destructive-tertiary"
                                                icon={<Trash2 />}
                                                tooltip="Remover item"
                                                onClick={() =>
                                                    d.removeItem(s.key, it.key)
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <DsSwitch
                                            label="Pede complemento"
                                            checked={it.hasFreeText}
                                            onCheckedChange={(v) =>
                                                d.patchItem(s.key, it.key, {
                                                    hasFreeText: v,
                                                })
                                            }
                                        />
                                        {it.hasFreeText && (
                                            <div className="min-w-0 flex-1">
                                                <DsInput
                                                    size="sm"
                                                    aria-label="Dica do complemento"
                                                    placeholder="Dica (ex.: minutos, nota de 0 a 10)"
                                                    value={it.placeholder}
                                                    onValueChange={(v) =>
                                                        d.patchItem(
                                                            s.key,
                                                            it.key,
                                                            { placeholder: v },
                                                        )
                                                    }
                                                />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ol>
                        <div className="px-4 pb-3">
                            <DsButton
                                size="sm"
                                variant="tertiary"
                                iconPosition="left"
                                icon={<Plus />}
                                label="Item"
                                onClick={() => d.addItem(s.key)}
                            />
                        </div>
                    </section>
                ))}
                <DsButton
                    variant="secondary"
                    iconPosition="left"
                    icon={<Plus />}
                    label="Nova seção"
                    onClick={d.addSection}
                />
            </div>

            <aside className="min-w-0 lg:sticky lg:top-0 lg:self-start">
                <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                    <h2 className="text-ds-body-sm font-semibold">
                        Experimente
                    </h2>
                    <p className="mb-3 text-ds-caption text-ds-content-muted">
                        Como fica na hora de escrever a evolução.
                    </p>
                    <TryTemplate
                        sections={d.sections.map((s) => ({
                            ...s,
                            items: s.items,
                        }))}
                    />
                </section>
            </aside>
        </div>
    );
}
