/** PROTÓTIPO (descartável): campos e avisos da avaliação respondida. */
import { ArrowLeft, Lock, PenLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
    DsBadge,
    DsButton,
    DsCheckbox,
    dsCn,
    DsInput,
    DsTextarea,
} from '@/components/ds';
import type { AssessmentField } from '@/domain/clinic';

import { answerText, type AnswerState } from './shared';

/** Escala como botões numerados, do verde ao vermelho (estilo EVA). */
function Scale({
    field,
    value,
    onChange,
    readOnly,
}: {
    field: AssessmentField;
    value: string;
    onChange: (v: string) => void;
    readOnly: boolean;
}) {
    const min = field.config?.min ?? 0;
    const max = field.config?.max ?? 10;
    if (max - min > 10) {
        return (
            <div className="max-w-40">
                <DsInput
                    type="number"
                    aria-label={field.label}
                    value={value}
                    onValueChange={onChange}
                    readonly={readOnly}
                    placeholder={`${min} a ${max}`}
                />
            </div>
        );
    }
    const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    return (
        <div className="flex flex-col gap-1.5">
            <div
                role="radiogroup"
                aria-label={field.label}
                className="flex flex-wrap gap-1"
            >
                {values.map((v) => {
                    const ratio = (v - min) / (max - min || 1);
                    const on = value === String(v);
                    return (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            disabled={readOnly}
                            onClick={() => onChange(on ? '' : String(v))}
                            className={dsCn(
                                'flex size-9 items-center justify-center rounded-ds-md border font-ds-mono text-ds-body-xs font-semibold transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
                                on
                                    ? 'border-transparent text-ds-white'
                                    : 'border-ds-border-default bg-ds-surface-default text-ds-content-secondary',
                                !readOnly &&
                                    'cursor-pointer hover:border-ds-border-strong',
                                readOnly && !on && 'opacity-50',
                            )}
                            style={
                                on
                                    ? {
                                          background:
                                              ratio < 0.34
                                                  ? 'var(--ds-color-success-100)'
                                                  : ratio < 0.67
                                                    ? 'var(--ds-color-warning-100)'
                                                    : 'var(--ds-color-danger-100)',
                                      }
                                    : undefined
                            }
                        >
                            {v}
                        </button>
                    );
                })}
            </div>
            {(field.config?.minLabel || field.config?.maxLabel) && (
                <div className="flex max-w-[460px] justify-between text-ds-caption text-ds-content-muted">
                    <span>{field.config?.minLabel}</span>
                    <span>{field.config?.maxLabel}</span>
                </div>
            )}
        </div>
    );
}

export function AnswerField({
    s,
    field,
}: {
    s: AnswerState;
    field: AssessmentField;
}) {
    const value = s.values[field.id] ?? '';
    const set = (v: string) => s.setValue(field.id, v);

    if (s.readOnly) {
        const text = answerText(s, field);
        return (
            <p
                className={dsCn(
                    'text-ds-body-sm whitespace-pre-line',
                    !text && 'text-ds-content-muted italic',
                )}
            >
                {text || 'Sem resposta'}
            </p>
        );
    }
    switch (field.fieldType) {
        case 'textarea':
            return (
                <DsTextarea
                    aria-label={field.label}
                    rows={3}
                    value={value}
                    onValueChange={set}
                    placeholder="Resposta"
                />
            );
        case 'text':
            return (
                <DsInput
                    aria-label={field.label}
                    value={value}
                    onValueChange={set}
                    placeholder="Resposta"
                />
            );
        case 'number':
            return (
                <div className="max-w-56">
                    <DsInput
                        type="number"
                        aria-label={field.label}
                        value={value}
                        onValueChange={set}
                        placeholder="0"
                        iconRight={
                            field.config?.unit ? (
                                <span className="text-ds-caption">
                                    {field.config.unit}
                                </span>
                            ) : undefined
                        }
                    />
                </div>
            );
        case 'range':
            return (
                <Scale
                    field={field}
                    value={value}
                    onChange={set}
                    readOnly={false}
                />
            );
        case 'checkbox':
            return (
                <div className="grid gap-2 sm:grid-cols-2">
                    {field.options.map((o) => (
                        <DsCheckbox
                            key={o.id}
                            label={o.label}
                            checked={(s.options[field.id] ?? []).includes(o.id)}
                            onCheckedChange={() =>
                                s.toggleOption(field.id, o.id)
                            }
                        />
                    ))}
                </div>
            );
        default:
            return null;
    }
}

export function FieldBlock({
    s,
    field,
}: {
    s: AnswerState;
    field: AssessmentField;
}) {
    return (
        <div className="flex flex-col gap-2">
            <p className="text-ds-body-xs font-medium">
                {field.label}
                {field.required && !s.readOnly && (
                    <span className="text-ds-content-danger"> *</span>
                )}
            </p>
            <AnswerField s={s} field={field} />
        </div>
    );
}

/** Assinada: aviso de só leitura, com o atalho do protótipo para preencher. */
export function SignedBanner({ s }: { s: AnswerState }) {
    if (!s.signed) return null;
    return (
        <div
            className={dsCn(
                'flex flex-wrap items-center gap-3 rounded-ds-xl border px-4 py-3',
                s.asDraft
                    ? 'border-ds-status-warning-border bg-ds-status-warning-surface'
                    : 'border-ds-border-subtle bg-ds-surface-subtle',
            )}
        >
            {s.asDraft ? (
                <PenLine className="size-5 text-ds-status-warning-content" />
            ) : (
                <Lock className="size-5 text-ds-content-muted" />
            )}
            <p className="flex-1 text-ds-body-xs">
                {s.asDraft
                    ? 'Protótipo: esta avaliação está assinada; os campos foram liberados só para testar o preenchimento.'
                    : `Assinada${s.assessment?.signedAt ? ` em ${new Date(s.assessment.signedAt).toLocaleDateString('pt-BR')}` : ''}${s.assessment?.clinicUser ? ` por ${s.assessment.clinicUser.name}` : ''}. Não dá mais para mudar.`}
            </p>
            <DsButton
                size="sm"
                variant="secondary"
                label={s.asDraft ? 'Voltar à assinada' : 'Ver como rascunho'}
                onClick={() => s.setDraftMode(!s.asDraft)}
            />
        </div>
    );
}

/** Cabeçalho comum: volta ao prontuário, modelo, paciente e progresso. */
export function AnswerHeader({
    s,
    children,
}: {
    s: AnswerState;
    children?: React.ReactNode;
}) {
    const navigate = useNavigate();
    return (
        <header className="flex flex-col gap-3">
            <button
                type="button"
                onClick={() => navigate(`/clinica/pacientes/${s.patientId}`)}
                className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60"
            >
                <ArrowLeft className="size-4" />
                {s.patient?.name ?? 'Prontuário'}
            </button>
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-ds-eyebrow text-ds-content-muted uppercase">
                        Avaliação #{s.assessment?.id}
                    </p>
                    <h1 className="text-ds-h4 font-semibold">
                        {s.assessment?.template.name ?? 'Avaliação'}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <DsBadge variant={s.readOnly ? 'success' : 'warning'}>
                        {s.readOnly ? 'Assinada' : 'Rascunho'}
                    </DsBadge>
                    <span className="font-ds-mono text-ds-caption text-ds-content-secondary">
                        {s.answered}/{s.total} respondidas
                    </span>
                </div>
            </div>
            {children}
        </header>
    );
}
