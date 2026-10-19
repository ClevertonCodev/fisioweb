/**
 * PROTÓTIPO (descartável): peças da nova avaliação. `FieldTry` desenha cada
 * tipo de pergunta do modelo com os componentes do DS, para experimentar
 * antes de começar (nada é salvo).
 */
import { useState } from 'react';

import { DsCheckbox, dsCn, DsInput, DsTextarea } from '@/components/ds';
import type { AssessmentField } from '@/domain/clinic';

/** Escala como botões numerados, do verde ao vermelho (estilo EVA). */
function ScaleTry({ field }: { field: AssessmentField }) {
    const min = field.config?.min ?? 0;
    const max = field.config?.max ?? 10;
    const [value, setValue] = useState<number | null>(null);
    const steps = max - min <= 10;
    if (!steps) {
        return (
            <DsInput
                type="number"
                aria-label={field.label}
                placeholder={`${min} a ${max}`}
            />
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
                    const on = value === v;
                    return (
                        <button
                            key={v}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => setValue(on ? null : v)}
                            className={dsCn(
                                'flex size-9 cursor-pointer items-center justify-center rounded-ds-md border font-ds-mono text-ds-body-xs font-semibold transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
                                on
                                    ? 'border-transparent text-ds-white'
                                    : 'border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-border-strong',
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
                <div className="flex justify-between text-ds-caption text-ds-content-muted">
                    <span>{field.config?.minLabel}</span>
                    <span>{field.config?.maxLabel}</span>
                </div>
            )}
        </div>
    );
}

export function FieldTry({ field }: { field: AssessmentField }) {
    const [picked, setPicked] = useState<string[]>([]);
    switch (field.fieldType) {
        case 'textarea':
            return (
                <DsTextarea
                    aria-label={field.label}
                    rows={3}
                    placeholder="Resposta"
                />
            );
        case 'text':
            return <DsInput aria-label={field.label} placeholder="Resposta" />;
        case 'number':
            return (
                <div className="max-w-56">
                    <DsInput
                        type="number"
                        aria-label={field.label}
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
            return <ScaleTry field={field} />;
        case 'checkbox':
            return (
                <div className="grid gap-2 sm:grid-cols-2">
                    {field.options.map((o) => (
                        <DsCheckbox
                            key={o.id}
                            label={o.label}
                            checked={picked.includes(String(o.id))}
                            onCheckedChange={(on) =>
                                setPicked((prev) =>
                                    on === true
                                        ? [...prev, String(o.id)]
                                        : prev.filter(
                                              (x) => x !== String(o.id),
                                          ),
                                )
                            }
                        />
                    ))}
                </div>
            );
        default:
            return null;
    }
}
