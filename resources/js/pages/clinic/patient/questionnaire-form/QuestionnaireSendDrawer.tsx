import { Plus } from 'lucide-react';

import { DsButton, DsDrawer, DsEmptyState } from '@/components/ds';

import {
    DeadlineChips,
    deadlineText,
    SentPanel,
    TemplateOption,
} from './parts';
import { questionsOf, useQuestionnaireSend } from './shared';

const TYPE_LABEL = {
    multiple_choice: 'escolha única',
    checkbox: 'várias opções',
    scale: 'escala',
    text: 'texto',
};

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
}

function Sender({
    patientId,
    patientName,
    patientPhone,
    patientEmail,
    onClose,
}: {
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
    onClose: () => void;
}) {
    const s = useQuestionnaireSend(
        patientId,
        patientName,
        patientPhone,
        patientEmail,
        onClose,
    );

    return (
        <DsDrawer
            open
            onOpenChange={(o) => !o && onClose()}
            placement="right"
            size="lg"
            title={s.sent ? 'Pronto' : 'Enviar questionário'}
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
                                ? `Pelo celular, ${deadlineText(s)}`
                                : 'Escolha um questionário'}
                        </p>
                        <DsButton
                            variant="secondary"
                            label="Cancelar"
                            onClick={onClose}
                        />
                        <DsButton
                            label="Enviar"
                            loading={s.sending}
                            disabled={!s.selected}
                            onClick={() => void s.send()}
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
                                2. Prazo para {patientName.split(' ')[0]}{' '}
                                responder pelo celular
                            </h3>
                            <DeadlineChips s={s} />
                        </section>
                    )}
                </div>
            )}
        </DsDrawer>
    );
}

export function QuestionnaireSendDrawer({
    open,
    onOpenChange,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
}: Props) {
    if (!open) return null;
    return (
        <Sender
            patientId={patientId}
            patientName={patientName}
            patientPhone={patientPhone}
            patientEmail={patientEmail}
            onClose={() => onOpenChange(false)}
        />
    );
}
