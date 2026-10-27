import { DsCheckbox, DsInput, DsModal } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { PatientEvolution } from '@/domain/clinic';

import {
    ModeSwitch,
    RepeatLastButton,
    SaveButtons,
    TemplateSelect,
    TextBlocks,
    TitleField,
} from './parts';
import { useEvolutionComposer } from './shared';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
    evolutionToEdit?: PatientEvolution;
}

function Composer({
    patientId,
    patientName,
    onClose,
    evolutionToEdit,
}: {
    patientId: string;
    patientName: string;
    onClose: () => void;
    evolutionToEdit?: PatientEvolution;
}) {
    const { user } = useAuth();
    const c = useEvolutionComposer(patientId, onClose, evolutionToEdit);
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });

    return (
        <DsModal
            open
            onOpenChange={(o) => !o && onClose()}
            size="full"
            title={c.isEditing ? 'Editar evolução' : 'Nova evolução'}
            meta={patientName}
            footer={<SaveButtons c={c} />}
        >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="flex min-w-0 flex-col gap-4">
                    <TitleField c={c} />
                    <div className="flex flex-wrap items-center gap-3">
                        <ModeSwitch c={c} />
                        <RepeatLastButton c={c} />
                    </div>
                    <TemplateSelect c={c} />
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
                                className="size-full min-h-64 resize-none bg-transparent outline-0 placeholder:text-ds-gray-50"
                            />
                        ) : c.blocks.length > 0 ? (
                            <TextBlocks blocks={c.blocks} />
                        ) : c.generated.trim() !== '' ? (
                            <p className="whitespace-pre-line">{c.generated}</p>
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
                            Aguardando assinatura
                        </p>
                    </footer>
                </article>
            </div>
        </DsModal>
    );
}

export function EvolutionFormModal({
    open,
    onOpenChange,
    patientId,
    patientName,
    evolutionToEdit,
}: Props) {
    if (!open) return null;
    return (
        <Composer
            key={evolutionToEdit?.id ?? 'new'}
            patientId={patientId}
            patientName={patientName}
            evolutionToEdit={evolutionToEdit}
            onClose={() => onOpenChange(false)}
        />
    );
}
