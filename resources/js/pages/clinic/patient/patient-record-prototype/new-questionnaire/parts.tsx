/** PROTÓTIPO (descartável): peças comuns ao envio de questionário. */
import {
    Check,
    CheckCircle2,
    Copy,
    MessageCircle,
    Smartphone,
    Stethoscope,
} from 'lucide-react';

import { DsBadge, DsButton, dsCn } from '@/components/ds';
import type { QuestionnaireTemplate } from '@/domain/clinic';

import {
    DEADLINES,
    minutesFor,
    questionsOf,
    STATUS_LABEL,
    type Modality,
    type QuestionnaireSend,
} from './shared';

export function TemplateOption({
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
                        {t.id < 0 && <DsBadge>Exemplo</DsBadge>}
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

export function ModalityCards({ s }: { s: QuestionnaireSend }) {
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

export function DeadlineChips({ s }: { s: QuestionnaireSend }) {
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

export function deadlineText(s: QuestionnaireSend): string {
    return s.expiresAt
        ? `até ${s.expiresAt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`
        : 'sem prazo';
}

/** Depois de enviar: o que acontece agora e como mandar o link. */
export function SentPanel({
    s,
    patientName,
}: {
    s: QuestionnaireSend;
    patientName: string;
}) {
    const first = patientName.split(' ')[0];
    return (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle2 className="size-14 text-ds-status-success-content" />
            <div>
                <p className="text-ds-body-lg font-semibold">
                    {s.modality === 'remoto'
                        ? `Pronto, agora é com ${first}`
                        : 'Fica pendente para a sessão'}
                </p>
                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                    {s.modality === 'remoto'
                        ? `"${s.selected?.title}" para responder ${deadlineText(s)}. Mande o link:`
                        : `"${s.selected?.title}" aparece no prontuário para responder com ${first}.`}
                </p>
            </div>
            {s.modality === 'remoto' && (
                <div className="flex flex-wrap justify-center gap-2">
                    <DsButton
                        iconPosition="left"
                        icon={<MessageCircle />}
                        label="Enviar pelo WhatsApp"
                        onClick={s.whatsapp}
                    />
                    <DsButton
                        variant="secondary"
                        iconPosition="left"
                        icon={<Copy />}
                        label="Copiar link"
                        onClick={s.copyLink}
                    />
                </div>
            )}
        </div>
    );
}
