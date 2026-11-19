import { Check } from 'lucide-react';

import { DsTextarea } from '@/components/ds/textarea/DsTextarea';
import { dsCn } from '@/components/ds/utils/ds-cn';
import type {
    PublicQuestion,
    PublicQuestionAnswer,
} from '@/domain/patient/questionnaire';

interface QuestionFieldProps {
    question: PublicQuestion;
    labelId: string;
    value: PublicQuestionAnswer | undefined;
    invalid: boolean;
    onChange: (value: PublicQuestionAnswer) => void;
}

const OPTION_BASE =
    'flex min-h-12 cursor-pointer items-center gap-3 rounded-ds-lg border-2 px-3 py-3 text-left text-ds-body-sm text-ds-content-primary transition-colors';
const OPTION_ON =
    'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium ds-dark:border-ds-primary-60';
const OPTION_OFF =
    'border-ds-border-subtle bg-ds-surface-default hover:border-ds-primary-40';

function ScaleField({
    question,
    labelId,
    value,
    onChange,
}: QuestionFieldProps) {
    const min = question.scaleMin;
    const max = Math.max(question.scaleMax, min);
    const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

    return (
        <div className="flex flex-col gap-2">
            <div
                role="radiogroup"
                aria-labelledby={labelId}
                className="grid grid-cols-6 gap-2 sm:grid-cols-11"
            >
                {values.map((n) => {
                    const on = value === n;
                    return (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => onChange(n)}
                            className={dsCn(
                                'flex h-11 cursor-pointer items-center justify-center rounded-ds-md border font-ds-mono text-ds-body-sm font-semibold tabular-nums transition-colors',
                                on
                                    ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-white ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                    : 'border-ds-border-subtle bg-ds-surface-default text-ds-content-primary hover:border-ds-primary-40',
                            )}
                        >
                            {n}
                        </button>
                    );
                })}
            </div>
            <div className="flex justify-between text-ds-caption text-ds-content-muted">
                <span>{min} · mínimo</span>
                <span>{max} · máximo</span>
            </div>
        </div>
    );
}

function ChoiceField({
    question,
    labelId,
    value,
    onChange,
}: QuestionFieldProps) {
    const multi = question.type === 'checkbox';
    const selected = Array.isArray(value) ? value : [];

    const toggle = (option: string) => {
        if (!multi) {
            onChange(option);
            return;
        }
        onChange(
            selected.includes(option)
                ? selected.filter((item) => item !== option)
                : [...selected, option],
        );
    };

    return (
        <div className="flex flex-col gap-2">
            {multi && (
                <p className="text-ds-caption text-ds-content-muted">
                    Pode marcar mais de uma.
                </p>
            )}
            <div
                role={multi ? 'group' : 'radiogroup'}
                aria-labelledby={labelId}
                className="flex flex-col gap-2"
            >
                {question.options.map((option) => {
                    const on = multi
                        ? selected.includes(option)
                        : value === option;
                    return (
                        <button
                            key={option}
                            type="button"
                            role={multi ? 'checkbox' : 'radio'}
                            aria-checked={on}
                            onClick={() => toggle(option)}
                            className={dsCn(
                                OPTION_BASE,
                                on ? OPTION_ON : OPTION_OFF,
                            )}
                        >
                            <span
                                aria-hidden
                                className={dsCn(
                                    'flex size-5 shrink-0 items-center justify-center border-2',
                                    multi ? 'rounded-ds-sm' : 'rounded-ds-full',
                                    on
                                        ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-white ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                        : 'border-ds-border-default',
                                )}
                            >
                                {on &&
                                    (multi ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        <span className="size-2 rounded-ds-full bg-ds-white" />
                                    ))}
                            </span>
                            {option}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export function QuestionField(props: QuestionFieldProps) {
    const { question, labelId, value, invalid, onChange } = props;

    if (question.type === 'scale') return <ScaleField {...props} />;

    if (question.type === 'text') {
        return (
            <DsTextarea
                aria-labelledby={labelId}
                placeholder="Escreva sua resposta"
                rows={3}
                state={invalid ? 'error' : 'default'}
                value={typeof value === 'string' ? value : ''}
                onValueChange={onChange}
            />
        );
    }

    return <ChoiceField {...props} />;
}
