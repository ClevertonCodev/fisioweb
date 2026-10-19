/**
 * PROTÓTIPO A, "Escolher e prever": a gaveta tem tudo numa coluna. Os
 * questionários da clínica como cartões (com o último envio a este
 * paciente, para não mandar de novo à toa); o escolhido abre e mostra as
 * perguntas. Embaixo, como o paciente responde e o prazo. "Criar novo"
 * leva à página de criar e volta com a gaveta aberta.
 */
import { Plus } from 'lucide-react';

import { DsButton, DsDrawer, DsEmptyState } from '@/components/ds';

import {
    DeadlineChips,
    deadlineText,
    ModalityCards,
    SentPanel,
    TemplateOption,
} from './parts';
import { questionsOf, type QuestionnaireSend } from './shared';

const TYPE_LABEL = {
    multiple_choice: 'escolha única',
    checkbox: 'várias opções',
    scale: 'escala',
    text: 'texto',
};

export function VariantA({
    s,
    patientName,
    onClose,
}: {
    s: QuestionnaireSend;
    patientName: string;
    onClose: () => void;
}) {
    return (
        <DsDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            placement="right"
            size="lg"
            title="Enviar questionário"
            meta={patientName}
            footer={
                s.sent ? (
                    <div className="flex w-full justify-end">
                        <DsButton label="Concluir" onClick={() => s.finish()} />
                    </div>
                ) : (
                    <div className="flex w-full items-center gap-3">
                        <p className="mr-auto min-w-0 truncate text-ds-caption text-ds-content-secondary">
                            {s.selected
                                ? s.modality === 'remoto'
                                    ? `Pelo celular, ${deadlineText(s)}`
                                    : 'Para responder na clínica'
                                : 'Escolha um questionário'}
                        </p>
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={onClose}
                        />
                        <DsButton
                            label="Enviar"
                            disabled={!s.selected}
                            onClick={s.send}
                        />
                    </div>
                )
            }
        >
            {s.sent ? (
                <SentPanel s={s} patientName={patientName} />
            ) : (
                <div className="flex flex-col gap-6">
                    <section className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <h3 className="mr-auto text-ds-body-sm font-semibold">
                                1. Qual questionário
                            </h3>
                            <DsButton
                                size="sm"
                                variant="tertiary"
                                iconPosition="left"
                                icon={<Plus />}
                                label="Criar novo"
                                onClick={s.createNew}
                            />
                        </div>
                        {s.loading ? (
                            <p className="text-ds-body-sm text-ds-content-muted">
                                Carregando…
                            </p>
                        ) : s.templates.length === 0 ? (
                            <DsEmptyState
                                variant="empty"
                                title="Nenhum questionário ainda"
                                description="Crie o primeiro; depois ele aparece aqui."
                                action={
                                    <DsButton
                                        iconPosition="left"
                                        icon={<Plus />}
                                        label="Criar questionário"
                                        onClick={s.createNew}
                                    />
                                }
                            />
                        ) : (
                            <div
                                role="radiogroup"
                                aria-label="Questionários"
                                className="flex flex-col gap-2"
                            >
                                {s.templates.map((t) => {
                                    const qs = questionsOf(t);
                                    return (
                                        <TemplateOption key={t.id} s={s} t={t}>
                                            <ol className="flex flex-col gap-1.5 border-t border-ds-border-brand-subtle px-4 py-3">
                                                {qs.slice(0, 6).map((q, i) => (
                                                    <li
                                                        key={q.id}
                                                        className="flex gap-2 text-ds-caption"
                                                    >
                                                        <span className="font-ds-mono text-ds-content-muted">
                                                            {i + 1}.
                                                        </span>
                                                        <span className="flex-1">
                                                            {q.label}
                                                        </span>
                                                        <span className="text-ds-content-muted">
                                                            {TYPE_LABEL[q.type]}
                                                        </span>
                                                    </li>
                                                ))}
                                                {qs.length > 6 && (
                                                    <li className="text-ds-caption text-ds-content-muted">
                                                        + {qs.length - 6}{' '}
                                                        perguntas
                                                    </li>
                                                )}
                                            </ol>
                                        </TemplateOption>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {s.selected && (
                        <section className="flex flex-col gap-3">
                            <h3 className="text-ds-body-sm font-semibold">
                                2. Como {patientName.split(' ')[0]} responde
                            </h3>
                            <ModalityCards s={s} />
                            {s.modality === 'remoto' && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-ds-body-xs text-ds-content-secondary">
                                        Prazo para responder
                                    </p>
                                    <DeadlineChips s={s} />
                                </div>
                            )}
                        </section>
                    )}
                </div>
            )}
        </DsDrawer>
    );
}
