import { Check } from 'lucide-react';

import { dsCn } from '../utils/ds-cn';

export type StepState = 'done' | 'current' | 'pending';

export interface Step {
    label: string;
    description?: string;
}

export interface StepsProps {
    steps: Step[];
    current?: number;
    vertical?: boolean;
    className?: string;
}

// Trilha horizontal: linha que passa pelo centro do círculo (antes e depois dele).
const TRACK_LINE =
    "before:absolute before:top-1/2 before:right-1/2 before:left-0 before:h-0.5 before:-translate-y-1/2 before:bg-ds-border-subtle before:content-[''] after:absolute after:top-1/2 after:right-0 after:left-1/2 after:h-0.5 after:-translate-y-1/2 after:bg-ds-border-subtle after:content-['']";

export function DsSteps({
    steps,
    current = 0,
    vertical = false,
    className,
}: StepsProps) {
    function getState(index: number): StepState {
        if (index < current) return 'done';
        if (index === current) return 'current';
        return 'pending';
    }

    return (
        <ol
            data-vertical={vertical || undefined}
            className={dsCn(
                'm-0 flex list-none p-0 font-ds',
                vertical ? 'w-auto flex-col' : 'w-full',
                className,
            )}
        >
            {steps.map((step, index) => {
                const state = getState(index);
                const isFirst = index === 0;
                const isLast = index === steps.length - 1;

                return (
                    <li
                        key={index}
                        data-state={state}
                        aria-current={state === 'current' ? 'step' : undefined}
                        className={dsCn(
                            'flex min-w-0',
                            vertical
                                ? "relative flex-row items-start gap-3.5 pb-7 text-left after:absolute after:top-11 after:bottom-0 after:left-[21px] after:w-0.5 after:bg-ds-border-subtle after:content-[''] last:pb-0 last:after:hidden"
                                : 'flex-[1_1_0] flex-col items-center gap-3 text-center',
                            vertical &&
                                state === 'done' &&
                                'after:bg-ds-primary-80',
                        )}
                    >
                        <span
                            className={dsCn(
                                'relative flex items-center justify-center',
                                vertical
                                    ? 'size-11 flex-none'
                                    : dsCn(
                                          'h-11 w-full',
                                          TRACK_LINE,
                                          isFirst && 'before:hidden',
                                          isLast && 'after:hidden',
                                          state === 'done' &&
                                              'before:bg-ds-primary-80 after:bg-ds-primary-80',
                                          state === 'current' &&
                                              'before:bg-ds-primary-80',
                                      ),
                            )}
                        >
                            <span
                                className={dsCn(
                                    'relative z-[1] grid size-11 flex-none place-items-center rounded-ds-pill border-2 border-ds-border-subtle bg-ds-surface-default text-ds-body-xs leading-none font-semibold text-ds-content-subtle transition-[background,border-color,color] duration-200 [&_svg]:size-5',
                                    state === 'done' &&
                                        'border-ds-primary-80 bg-ds-primary-80 text-ds-white',
                                    state === 'current' &&
                                        'border-ds-primary-80 text-ds-content-brand',
                                )}
                            >
                                {state === 'done' ? (
                                    <Check
                                        data-testid="ds-step-check"
                                        aria-hidden="true"
                                    />
                                ) : (
                                    index + 1
                                )}
                            </span>
                        </span>
                        <span
                            className={dsCn(
                                'grid max-w-full gap-0.5 px-1.5',
                                vertical && 'pt-[3px]',
                            )}
                        >
                            <span
                                className={dsCn(
                                    'text-ds-body-xs font-medium text-ds-content-muted',
                                    state === 'done' && 'text-ds-content-brand',
                                    state === 'current' &&
                                        'font-semibold text-ds-content-brand',
                                )}
                            >
                                {step.label}
                            </span>
                            {step.description && (
                                <span
                                    className={dsCn(
                                        'text-ds-caption text-ds-content-subtle',
                                        state !== 'pending' &&
                                            'text-ds-content-muted',
                                    )}
                                >
                                    {step.description}
                                </span>
                            )}
                            {state === 'done' && (
                                <span className="sr-only">(concluído)</span>
                            )}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
