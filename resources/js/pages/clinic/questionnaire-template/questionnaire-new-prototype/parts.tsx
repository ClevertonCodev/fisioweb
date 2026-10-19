/**
 * PROTÓTIPO (descartável): peças do novo questionário. `QuestionEditor`
 * edita uma pergunta.
 */
import {
    AlignLeft,
    ArrowDown,
    ArrowUp,
    CircleDot,
    Copy,
    ListChecks,
    Plus,
    SlidersHorizontal,
    Trash2,
    X,
    type LucideIcon,
} from 'lucide-react';

import type {
    DraftQuestion,
    QuestionType,
} from '@/components/clinic/questionnaire-template/types';
import { DsButton, dsCn, DsInput, DsSwitch } from '@/components/ds';

import { TYPE_LABEL } from './shared';

export const TYPE_ICON: Record<QuestionType, LucideIcon> = {
    multiple_choice: CircleDot,
    checkbox: ListChecks,
    scale: SlidersHorizontal,
    text: AlignLeft,
};

const TYPES: QuestionType[] = ['multiple_choice', 'checkbox', 'scale', 'text'];

export function QuestionEditor({
    q,
    index,
    onChange,
    onMove,
    onDuplicate,
    onRemove,
    canUp,
    canDown,
}: {
    q: DraftQuestion;
    index: number;
    onChange: (patch: Partial<DraftQuestion>) => void;
    onMove: (dir: -1 | 1) => void;
    onDuplicate: () => void;
    onRemove: () => void;
    canUp: boolean;
    canDown: boolean;
}) {
    const hasOptions = q.type === 'multiple_choice' || q.type === 'checkbox';
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
                <span className="mt-2.5 font-ds-mono text-ds-caption text-ds-content-muted">
                    {index + 1}.
                </span>
                <div className="flex-1">
                    <DsInput
                        aria-label={`Pergunta ${index + 1}`}
                        placeholder="Escreva a pergunta"
                        value={q.label}
                        onValueChange={(label) => onChange({ label })}
                    />
                </div>
            </div>

            <div
                role="radiogroup"
                aria-label="Tipo de resposta"
                className="flex flex-wrap gap-1 pl-7"
            >
                {TYPES.map((t) => {
                    const Icon = TYPE_ICON[t];
                    const on = q.type === t;
                    return (
                        <button
                            key={t}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() =>
                                onChange({
                                    type: t,
                                    options:
                                        (t === 'multiple_choice' ||
                                            t === 'checkbox') &&
                                        q.options.length === 0
                                            ? ['', '']
                                            : q.options,
                                })
                            }
                            className={dsCn(
                                'flex cursor-pointer items-center gap-1.5 rounded-ds-pill border px-3 py-1 text-ds-caption transition-colors [&_svg]:size-3.5',
                                on
                                    ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60'
                                    : 'border-ds-border-subtle text-ds-content-secondary hover:border-ds-border-brand-subtle',
                            )}
                        >
                            <Icon />
                            {TYPE_LABEL[t]}
                        </button>
                    );
                })}
            </div>

            {hasOptions && (
                <ul className="flex flex-col gap-2 pl-7">
                    {q.options.map((o, i) => (
                        <li key={i} className="flex items-center gap-2">
                            <span
                                className={dsCn(
                                    'size-4 shrink-0 border-2 border-ds-border-strong',
                                    q.type === 'multiple_choice'
                                        ? 'rounded-ds-full'
                                        : 'rounded-ds-xs',
                                )}
                            />
                            <div className="flex-1">
                                <DsInput
                                    size="sm"
                                    aria-label={`Opção ${i + 1}`}
                                    placeholder={`Opção ${i + 1}`}
                                    value={o}
                                    onValueChange={(v) =>
                                        onChange({
                                            options: q.options.map((x, j) =>
                                                j === i ? v : x,
                                            ),
                                        })
                                    }
                                />
                            </div>
                            <DsButton
                                size="sm"
                                variant="tertiary"
                                iconPosition="only"
                                icon={<X />}
                                label="Tirar opção"
                                disabled={q.options.length <= 2}
                                onClick={() =>
                                    onChange({
                                        options: q.options.filter(
                                            (_, j) => j !== i,
                                        ),
                                    })
                                }
                            />
                        </li>
                    ))}
                    <li>
                        <DsButton
                            size="sm"
                            variant="tertiary"
                            iconPosition="left"
                            icon={<Plus />}
                            label="Opção"
                            onClick={() =>
                                onChange({ options: [...q.options, ''] })
                            }
                        />
                    </li>
                </ul>
            )}

            {q.type === 'scale' && (
                <div className="flex items-center gap-3 pl-7 text-ds-body-xs">
                    <span>De</span>
                    <div className="w-20">
                        <DsInput
                            size="sm"
                            type="number"
                            aria-label="Mínimo"
                            value={String(q.scaleMin)}
                            onValueChange={(v) =>
                                onChange({ scaleMin: Number(v) || 0 })
                            }
                        />
                    </div>
                    <span>a</span>
                    <div className="w-20">
                        <DsInput
                            size="sm"
                            type="number"
                            aria-label="Máximo"
                            value={String(q.scaleMax)}
                            onValueChange={(v) =>
                                onChange({ scaleMax: Number(v) || 0 })
                            }
                        />
                    </div>
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1 border-t border-ds-border-subtle pt-3 pl-7">
                <DsSwitch
                    label="Obrigatória"
                    checked={q.required}
                    onCheckedChange={(required) => onChange({ required })}
                />
                <div className="ml-auto flex gap-1">
                    <DsButton
                        size="sm"
                        variant="tertiary"
                        iconPosition="only"
                        icon={<ArrowUp />}
                        label="Subir"
                        disabled={!canUp}
                        onClick={() => onMove(-1)}
                    />
                    <DsButton
                        size="sm"
                        variant="tertiary"
                        iconPosition="only"
                        icon={<ArrowDown />}
                        label="Descer"
                        disabled={!canDown}
                        onClick={() => onMove(1)}
                    />
                    <DsButton
                        size="sm"
                        variant="tertiary"
                        iconPosition="only"
                        icon={<Copy />}
                        label="Duplicar"
                        onClick={onDuplicate}
                    />
                    <DsButton
                        size="sm"
                        variant="destructive-tertiary"
                        iconPosition="only"
                        icon={<Trash2 />}
                        label="Excluir pergunta"
                        onClick={onRemove}
                    />
                </div>
            </div>
        </div>
    );
}
