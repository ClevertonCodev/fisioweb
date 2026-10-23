/**
 * Escolher e prever: gaveta numa coluna, cartões com as perguntas, como
 * o paciente responde e o prazo. Depois do envio, Copiar / WhatsApp / E-mail.
 */
import {
    Check,
    CheckCircle2,
    Plus,
    Smartphone,
    Stethoscope,
} from 'lucide-react';

import {
    DsBadge,
    DsButton,
    dsCn,
    DsDrawer,
    DsEmptyState,
} from '@/components/ds';
import type { QuestionnaireTemplate } from '@/domain/clinic';

import { QuestionnaireShareButtons } from '../parts';

import {
    DEADLINES,
    minutesFor,
    questionsOf,
    STATUS_LABEL,
    useQuestionnaireSend,
    type Modality,
    type QuestionnaireSend,
} from './questionnaire';

const TYPE_LABEL = {
    multiple_choice: 'escolha única',
    checkbox: 'várias opções',
    scale: 'escala',
    text: 'texto',
};

function TemplateOption({
    s,
    t,
    children,
}: {
    s: QuestionnaireSend;
    t: QuestionnaireTemplate;
    children?: React.ReactNode;
}) {
    const on = s.selected?.id === t.id;
    const n = questionsOf(t).length;
    const last = s.lastSentOf(t.id);
    return (
        <div
            className={dsCn(
                'rounded-ds-xl border transition-colors',
                on
                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle ds-dark:border-ds-primary-60'
                    : 'border-ds-border-subtle bg-ds-surface-default hover:border-ds-border-brand-subtle',
            )}
        >
            <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => s.select(t.id)}
                className="flex w-full cursor-pointer items-start gap-3 p-4 text-left focus-visible:shadow-ds-focus focus-visible:outline-0"
            >
                <span
                    className={dsCn(
                        'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-ds-full border-2',
                        on
                            ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-white ds-dark:border-ds-primary-60 ds-dark:bg-ds-primary-60'
                            : 'border-ds-border-default',
                    )}
                >
                    {on && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2 text-ds-body-sm font-medium">
                        {t.title}
                    </span>
                    <span className="block text-ds-caption text-ds-content-muted">
                        {n} perguntas · {minutesFor(n)}
                    </span>
                    {last && (
                        <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-ds-caption text-ds-content-secondary">
                            Enviado em{' '}
                            {new Date(last.createdAt).toLocaleDateString(
                                'pt-BR',
                            )}
                            <DsBadge
                                variant={
                                    last.status === 'answered'
                                        ? 'success'
                                        : last.status === 'pending'
                                          ? 'warning'
                                          : 'default'
                                }
                                dot
                            >
                                {STATUS_LABEL[last.status]}
                            </DsBadge>
                        </span>
                    )}
                </span>
            </button>
            {on && children}
        </div>
    );
}

function ModalityCards({ s }: { s: QuestionnaireSend }) {
    const cards: {
        key: Modality;
        icon: React.ReactNode;
        title: string;
        text: string;
    }[] = [
        {
            key: 'remoto',
            icon: <Smartphone />,
            title: 'Pelo celular',
            text: 'O paciente recebe um link e responde de casa.',
        },
        {
            key: 'presencial',
            icon: <Stethoscope />,
            title: 'Aqui na clínica',
            text: 'Fica pendente para responder na sessão, com você.',
        },
    ];
    return (
        <div
            role="radiogroup"
            aria-label="Como o paciente responde"
            className="grid gap-3 sm:grid-cols-2"
        >
            {cards.map((c) => (
                <button
                    key={c.key}
                    type="button"
                    role="radio"
                    aria-checked={s.modality === c.key}
                    onClick={() => s.setModality(c.key)}
                    className={dsCn(
                        'flex cursor-pointer flex-col items-start gap-2 rounded-ds-xl border p-4 text-left transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0 [&_svg]:size-5',
                        s.modality === c.key
                            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle ds-dark:border-ds-primary-60'
                            : 'border-ds-border-subtle bg-ds-surface-default hover:border-ds-border-brand-subtle',
                    )}
                >
                    <span className="text-ds-content-brand ds-dark:text-ds-primary-60">
                        {c.icon}
                    </span>
                    <span className="text-ds-body-sm font-semibold">
                        {c.title}
                    </span>
                    <span className="text-ds-caption text-ds-content-secondary">
                        {c.text}
                    </span>
                </button>
            ))}
        </div>
    );
}

function DeadlineChips({ s }: { s: QuestionnaireSend }) {
    return (
        <div
            role="radiogroup"
            aria-label="Prazo para responder"
            className="flex flex-wrap gap-2"
        >
            {DEADLINES.map((d) => (
                <button
                    key={d.key}
                    type="button"
                    role="radio"
                    aria-checked={s.deadline === d.key}
                    onClick={() => s.setDeadline(d.key)}
                    className={dsCn(
                        'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-body-xs transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
                        s.deadline === d.key
                            ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-content-on-brand ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
                    )}
                >
                    {d.label}
                </button>
            ))}
        </div>
    );
}

function deadlineText(s: QuestionnaireSend): string {
    return s.expiresAt
        ? `até ${s.expiresAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`
        : 'sem prazo';
}

function SentPanel({
    s,
    patientName,
    patientPhone,
    patientEmail,
}: {
    s: QuestionnaireSend;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
}) {
    const first = patientName.split(' ')[0];
    const shareUrl = s.sent?.shareUrl ?? null;
    const title =
        s.selected?.title ?? s.sent?.template?.title ?? 'Questionário';
    return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-14 text-ds-status-success-content" />
            <div>
                <h2 className="text-ds-body-lg font-semibold">
                    {s.modality === 'remoto'
                        ? `Pronto, agora é com ${first}`
                        : 'Fica pendente para a sessão'}
                </h2>
                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                    {s.modality === 'remoto'
                        ? `"${title}" para responder ${deadlineText(s)}. Mande o link:`
                        : `"${title}" aparece no prontuário para responder com ${first}.`}
                </p>
            </div>
            {s.modality === 'remoto' && (
                <div className="flex w-full max-w-md flex-col gap-3 text-left">
                    {shareUrl && (
                        <p className="truncate text-center text-ds-caption text-ds-content-muted">
                            {shareUrl}
                        </p>
                    )}
                    <QuestionnaireShareButtons
                        shareUrl={shareUrl}
                        title={title}
                        patientName={patientName}
                        patientPhone={patientPhone}
                        patientEmail={patientEmail}
                    />
                </div>
            )}
        </div>
    );
}

export function QuestionnaireDrawer({
    open,
    onOpenChange,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientName: string;
    patientPhone?: string;
    patientEmail?: string;
}) {
    const onClose = () => onOpenChange(false);
    const s = useQuestionnaireSend(patientId, onClose);

    return (
        <DsDrawer
            open={open}
            onOpenChange={(o) => {
                if (!o) {
                    s.reset();
                    onClose();
                }
            }}
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
                            loading={s.sending}
                            onClick={() => void s.send()}
                        />
                    </div>
                )
            }
        >
            {s.sent ? (
                <SentPanel
                    s={s}
                    patientName={patientName}
                    patientPhone={patientPhone}
                    patientEmail={patientEmail}
                />
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
