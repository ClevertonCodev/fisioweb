/**
 * Folha da evolução: o que se assina é o que se vê. Modelo à esquerda,
 * folha à direita. No texto livre, a própria folha vira o campo.
 */
import { History, LayoutTemplate, PenLine } from 'lucide-react';

import { DsButton, DsCheckbox, dsCn, DsInput, DsModal } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { PatientEvolution } from '@/domain/clinic';

import {
    type EvolutionComposer,
    type Mode,
    type TextBlock,
    useEvolutionComposer,
} from './evolution';

function TitleField({ c }: { c: EvolutionComposer }) {
    return (
        <DsInput
            label="Título da sessão"
            value={c.title}
            onValueChange={c.setTitle}
            state={c.titleError ? 'error' : 'default'}
            helper={c.titleError ? 'Dê um título para a sessão.' : undefined}
            disabled={c.isReadOnly}
        />
    );
}

function ModeSwitch({ c }: { c: EvolutionComposer }) {
    const options: { key: Mode; label: string; icon: React.ReactNode }[] = [
        { key: 'template', label: 'Com modelo', icon: <LayoutTemplate /> },
        { key: 'free', label: 'Texto livre', icon: <PenLine /> },
    ];
    return (
        <div
            role="radiogroup"
            aria-label="Como registrar"
            className="flex w-fit gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
        >
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    role="radio"
                    aria-checked={c.mode === o.key}
                    disabled={c.isReadOnly}
                    onClick={() => c.setMode(o.key)}
                    className={dsCn(
                        'flex cursor-pointer items-center gap-2 rounded-ds-md px-3 py-1.5 text-ds-body-xs transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0 [&_svg]:size-4',
                        c.mode === o.key
                            ? 'bg-ds-surface-default font-medium text-ds-content-primary shadow-ds-xs'
                            : 'text-ds-content-secondary hover:text-ds-content-primary',
                    )}
                >
                    {o.icon}
                    {o.label}
                </button>
            ))}
        </div>
    );
}

function RepeatLastButton({ c }: { c: EvolutionComposer }) {
    if (!c.last || c.isReadOnly) return null;
    const date = new Date(
        c.last.signedAt ?? c.last.createdAt,
    ).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return (
        <DsButton
            size="sm"
            variant="secondary"
            iconPosition="left"
            icon={<History />}
            label={`Repetir a sessão de ${date}`}
            onClick={c.repeatLast}
        />
    );
}

function TextBlocks({
    blocks,
    className,
}: {
    blocks: TextBlock[];
    className?: string;
}) {
    return (
        <div className={dsCn('flex flex-col gap-3', className)}>
            {blocks.map((b) => (
                <div key={b.section}>
                    <p className="font-semibold">{b.section}:</p>
                    {b.lines.map((l) => (
                        <p key={l}>{l}</p>
                    ))}
                </div>
            ))}
        </div>
    );
}

function SaveButtons({
    c,
    onClose,
}: {
    c: EvolutionComposer;
    onClose: () => void;
}) {
    if (c.isReadOnly) {
        return (
            <div className="flex w-full justify-end">
                <DsButton
                    variant="secondary"
                    label="Fechar"
                    onClick={onClose}
                />
            </div>
        );
    }
    return (
        <div className="flex w-full items-center gap-3">
            <p className="mr-auto hidden text-ds-caption text-ds-content-muted sm:block">
                Assinada, a evolução não muda mais.
            </p>
            <DsButton
                variant="secondary"
                label="Salvar rascunho"
                loading={c.saving}
                onClick={() => void c.save(false)}
            />
            <DsButton
                label="Assinar e salvar"
                loading={c.saving}
                onClick={() => void c.save(true)}
            />
        </div>
    );
}

function Sheet({
    c,
    patientName,
    onClose,
    open,
}: {
    c: EvolutionComposer;
    patientName: string;
    onClose: () => void;
    open: boolean;
}) {
    const { user } = useAuth();
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
    const title = c.isReadOnly
        ? 'Evolução'
        : c.isEditing
          ? 'Editar evolução'
          : 'Nova evolução';

    return (
        <DsModal
            open={open}
            onOpenChange={(o) => !o && onClose()}
            size="full"
            title={title}
            meta={patientName}
            footer={<SaveButtons c={c} onClose={onClose} />}
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="flex min-w-0 flex-col gap-4">
                    <TitleField c={c} />
                    <div className="flex flex-wrap items-center gap-3">
                        <ModeSwitch c={c} />
                        <RepeatLastButton c={c} />
                    </div>
                    {c.mode === 'template' ? (
                        <div className="flex flex-col gap-4 lg:max-h-[56vh] lg:overflow-y-auto lg:pr-2">
                            {c.sections.map((s) => (
                                <fieldset
                                    key={s.id}
                                    className="flex flex-col gap-2"
                                >
                                    <legend className="mb-2 text-ds-eyebrow text-ds-content-muted uppercase">
                                        {s.title}
                                    </legend>
                                    {s.items.map((i) => {
                                        const on = c.checked.has(i.id);
                                        return (
                                            <div
                                                key={i.id}
                                                className="flex flex-col gap-2"
                                            >
                                                <DsCheckbox
                                                    label={i.label}
                                                    checked={on}
                                                    disabled={c.isReadOnly}
                                                    onCheckedChange={() =>
                                                        c.toggle(i.id)
                                                    }
                                                />
                                                {on && i.hasFreeText && (
                                                    <div className="pl-7">
                                                        <DsInput
                                                            size="sm"
                                                            aria-label={`Detalhe de ${i.label}`}
                                                            placeholder={
                                                                i.freeTextPlaceholder ??
                                                                'Detalhe (opcional)'
                                                            }
                                                            value={
                                                                c.freeTexts[
                                                                    i.id
                                                                ] ?? ''
                                                            }
                                                            disabled={
                                                                c.isReadOnly
                                                            }
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                c.setFree(
                                                                    i.id,
                                                                    v,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </fieldset>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-ds-lg bg-ds-surface-subtle p-4 text-ds-body-sm text-ds-content-secondary">
                            Escreva direto na folha ao lado. Se preferir, volte
                            para &quot;Com modelo&quot; e marque os
                            procedimentos.
                        </p>
                    )}
                </div>

                <article
                    aria-label="Folha da evolução"
                    className="flex min-h-[520px] min-w-0 flex-col rounded-ds-lg border border-ds-border-subtle bg-ds-white p-6 text-ds-gray-100 shadow-ds-md sm:p-8"
                >
                    <header className="flex items-start justify-between gap-4 border-b border-ds-gray-30 pb-4">
                        <div>
                            <p className="text-ds-micro tracking-[0.12em] text-ds-gray-60 uppercase">
                                Evolução
                            </p>
                            <h2 className="mt-1 text-ds-body-lg font-semibold">
                                {c.title || 'Sem título'}
                            </h2>
                        </div>
                        <dl className="shrink-0 text-right text-ds-caption text-ds-gray-80">
                            <dt className="sr-only">Paciente</dt>
                            <dd className="font-medium">{patientName}</dd>
                            <dt className="sr-only">Data</dt>
                            <dd>{today}</dd>
                        </dl>
                    </header>

                    <div className="flex-1 py-5 text-ds-body-sm leading-relaxed">
                        {c.mode === 'free' ? (
                            <textarea
                                aria-label="Texto da evolução"
                                value={c.freeText}
                                onChange={(e) => c.setFreeText(e.target.value)}
                                placeholder="Escreva a evolução da sessão…"
                                disabled={c.isReadOnly}
                                className="size-full min-h-64 resize-none bg-transparent outline-0 placeholder:text-ds-gray-50"
                            />
                        ) : c.blocks.length > 0 ? (
                            <TextBlocks blocks={c.blocks} />
                        ) : (
                            <p className="text-ds-gray-50">
                                Os procedimentos marcados aparecem aqui.
                            </p>
                        )}
                        <div className="mt-5 border-t border-dashed border-ds-gray-30 pt-4">
                            <p className="mb-1 text-ds-caption font-semibold text-ds-gray-80">
                                Notas
                            </p>
                            <textarea
                                aria-label="Notas"
                                value={c.notes}
                                onChange={(e) => c.setNotes(e.target.value)}
                                rows={3}
                                placeholder="Relato do paciente, intercorrências…"
                                disabled={c.isReadOnly}
                                className="w-full resize-none bg-transparent text-ds-body-sm outline-0 placeholder:text-ds-gray-50"
                            />
                        </div>
                    </div>

                    <footer className="mt-auto pt-6 text-center">
                        <div className="mx-auto mb-1.5 h-px w-2/3 bg-ds-gray-60" />
                        <p className="text-ds-caption font-semibold">
                            {user?.name}
                        </p>
                        <p className="text-ds-micro text-ds-gray-60">
                            Assinatura digital ao salvar
                        </p>
                    </footer>
                </article>
            </div>
        </DsModal>
    );
}

export function EvolutionModal({
    open,
    onOpenChange,
    patientId,
    patientName,
    evolutionToEdit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
    evolutionToEdit?: PatientEvolution;
}) {
    const onClose = () => onOpenChange(false);
    const c = useEvolutionComposer(patientId, onClose, evolutionToEdit);
    return (
        <Sheet c={c} patientName={patientName} onClose={onClose} open={open} />
    );
}
