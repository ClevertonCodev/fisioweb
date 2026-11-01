/**
 * "Repetir: recorrente" do lançamento novo: a frequência (semanal, mensal ou
 * anual), o fim ("sem data para acabar" ou "até" uma data) e a prévia da regra.
 * O servidor cria as ocorrências até 12 meses à frente e as próximas sozinho.
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useId } from 'react';
import { Controller, type UseFormReturn } from 'react-hook-form';

import type { TransactionFormValues } from '@/application/clinic/finance-transaction-form';
import { dsCn, DsDatepicker } from '@/components/ds';
import type { RecurrenceFrequency } from '@/domain/clinic/finance';

type EndsMode = NonNullable<TransactionFormValues['endsMode']>;

const FREQUENCIES: ReadonlyArray<readonly [RecurrenceFrequency, string]> = [
    ['weekly', 'Semanal'],
    ['monthly', 'Mensal'],
    ['yearly', 'Anual'],
];

const ENDS: ReadonlyArray<readonly [EndsMode, string]> = [
    ['never', 'Sem data para acabar'],
    ['until', 'Até uma data'],
];

/** "Toda quinta-feira", "Todo mês no dia 31 (ou o último dia do mês)", "Todo ano em 29/02 (…)". */
export function recurrenceRule(
    frequency: RecurrenceFrequency,
    date: Date,
): string {
    if (frequency === 'weekly') {
        const weekday = format(date, 'EEEE', { locale: ptBR });
        const weekend = date.getDay() === 0 || date.getDay() === 6;
        return `${weekend ? 'Todo' : 'Toda'} ${weekday}`;
    }
    if (frequency === 'monthly') {
        const day = date.getDate();
        return day > 28
            ? `Todo mês no dia ${day} (ou no último dia, nos meses mais curtos)`
            : `Todo mês no dia ${day}`;
    }
    const leapDay = date.getMonth() === 1 && date.getDate() === 29;
    return leapDay
        ? 'Todo ano em 29/02 (28/02 nos anos não bissextos)'
        : `Todo ano em ${format(date, 'dd/MM')}`;
}

export function TransactionRecurrenceFields({
    form,
}: {
    form: UseFormReturn<TransactionFormValues>;
}) {
    const endsOnId = useId();
    const frequency = form.watch('frequency') ?? 'monthly';
    const endsMode = form.watch('endsMode') ?? 'never';
    const date = form.watch('date');
    const endsOn = form.watch('endsOn');

    return (
        <div className="flex flex-col gap-3 rounded-ds-lg bg-ds-surface-subtle p-4">
            <Segmented
                label="Frequência"
                options={FREQUENCIES}
                value={frequency}
                onChange={(next) => form.setValue('frequency', next)}
            />
            <Segmented
                label="Termina"
                options={ENDS}
                value={endsMode}
                onChange={(next) => {
                    form.setValue('endsMode', next);
                    form.clearErrors('endsOn');
                }}
            />
            {endsMode === 'until' && (
                <Controller
                    control={form.control}
                    name="endsOn"
                    render={({ field, fieldState }) => (
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor={endsOnId}
                                className="text-ds-body-xs font-medium"
                            >
                                Até
                            </label>
                            <DsDatepicker
                                id={endsOnId}
                                mode="single"
                                placeholder="Escolha a data"
                                ref={field.ref}
                                minDate={date ?? undefined}
                                value={field.value ?? null}
                                onValueChange={(v) =>
                                    field.onChange(v instanceof Date ? v : null)
                                }
                            />
                            {fieldState.error?.message && (
                                <span
                                    role="alert"
                                    className="text-ds-caption text-ds-status-danger-content"
                                >
                                    {fieldState.error.message}
                                </span>
                            )}
                        </div>
                    )}
                />
            )}
            {date && (
                <p
                    data-testid="recurrence-preview"
                    className="text-ds-body-xs text-ds-content-secondary"
                >
                    <strong className="text-ds-body-sm font-medium text-ds-content-primary">
                        {recurrenceRule(frequency, date)}
                    </strong>{' '}
                    · a partir de {format(date, 'dd/MM/yyyy')} ·{' '}
                    {endsMode === 'until' && endsOn
                        ? `até ${format(endsOn, 'dd/MM/yyyy')}`
                        : endsMode === 'until'
                          ? 'até…'
                          : 'sem data para acabar'}
                </p>
            )}
            <p className="text-ds-caption text-ds-content-subtle">
                Ficam lançadas até 12 meses à frente, e as próximas aparecem
                sozinhas. A 1ª fica com a situação escolhida; as outras,
                pendentes.
            </p>
        </div>
    );
}

function Segmented<T extends string>({
    label,
    options,
    value,
    onChange,
}: {
    label: string;
    options: ReadonlyArray<readonly [T, string]>;
    value: T;
    onChange: (next: T) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <span className="text-ds-body-xs font-medium">{label}</span>
            <div
                role="radiogroup"
                aria-label={label}
                className={dsCn(
                    'grid gap-1 rounded-ds-lg bg-ds-surface-default p-1',
                    options.length === 3 ? 'grid-cols-3' : 'grid-cols-2',
                )}
            >
                {options.map(([key, text]) => (
                    <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={value === key}
                        onClick={() => onChange(key)}
                        className={dsCn(
                            'cursor-pointer rounded-ds-md px-2 py-2 text-ds-body-xs transition-colors',
                            value === key
                                ? 'bg-ds-surface-subtle font-medium shadow-ds-xs'
                                : 'text-ds-content-secondary',
                        )}
                    >
                        {text}
                    </button>
                ))}
            </div>
        </div>
    );
}
