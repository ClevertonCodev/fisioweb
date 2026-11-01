/**
 * "Repetir" do lançamento novo: não repete, parcelado (de 2 a 48 vezes, uma
 * por mês a partir da data, com a prévia do valor de cada parcela como o
 * servidor divide) ou recorrente (`TransactionRecurrenceFields`).
 */
import { format } from 'date-fns';
import { Controller, type UseFormReturn } from 'react-hook-form';

import {
    installmentAmounts,
    parseInstallments,
    type TransactionFormValues,
} from '@/application/clinic/finance-transaction-form';
import { dsCn, DsInput } from '@/components/ds';

import { money } from './finance-format';
import { TransactionRecurrenceFields } from './TransactionRecurrenceFields';

type RepeatKind = NonNullable<TransactionFormValues['repeatKind']>;

const OPTIONS: ReadonlyArray<readonly [RepeatKind, string]> = [
    ['none', 'Não repete'],
    ['installments', 'Parcelado'],
    ['recurrence', 'Recorrente'],
];

export function TransactionRepeatField({
    form,
}: {
    form: UseFormReturn<TransactionFormValues>;
}) {
    const kind = form.watch('repeatKind') ?? 'none';

    const choose = (next: RepeatKind) => {
        form.setValue('repeatKind', next);
        form.clearErrors(['installments', 'endsOn']);
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                <span className="text-ds-body-xs font-medium">Repetir</span>
                <div
                    role="radiogroup"
                    aria-label="Repetir"
                    className="grid grid-cols-3 gap-1 rounded-ds-lg bg-ds-surface-subtle p-1"
                >
                    {OPTIONS.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={kind === key}
                            onClick={() => choose(key)}
                            className={dsCn(
                                'cursor-pointer rounded-ds-md py-2 text-ds-body-xs transition-colors',
                                kind === key
                                    ? 'bg-ds-surface-default font-medium shadow-ds-xs'
                                    : 'text-ds-content-secondary',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>
            {kind === 'installments' && <InstallmentsFields form={form} />}
            {kind === 'recurrence' && (
                <TransactionRecurrenceFields form={form} />
            )}
        </div>
    );
}

function InstallmentsFields({
    form,
}: {
    form: UseFormReturn<TransactionFormValues>;
}) {
    const amount = form.watch('amount');
    const date = form.watch('date');
    const total = parseInstallments(form.watch('installments') ?? '');
    const parts = total ? installmentAmounts(amount, total) : null;

    return (
        <div className="flex flex-col gap-3 rounded-ds-lg bg-ds-surface-subtle p-4">
            <Controller
                control={form.control}
                name="installments"
                render={({ field, fieldState }) => (
                    <DsInput
                        label="Número de parcelas"
                        inputMode="numeric"
                        placeholder="De 2 a 48"
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? ''}
                        onValueChange={(v) =>
                            field.onChange(v.replace(/\D/g, '').slice(0, 2))
                        }
                        onBlur={field.onBlur}
                        state={fieldState.error ? 'error' : 'default'}
                        helper={
                            fieldState.error?.message ??
                            'Uma por mês, a partir da data. A 1ª fica com a situação escolhida; as outras, pendentes.'
                        }
                    />
                )}
            />
            {total && parts && (
                <p
                    data-testid="installment-preview"
                    className="text-ds-body-xs text-ds-content-secondary"
                >
                    <strong className="font-ds-mono text-ds-body-sm text-ds-content-primary">
                        {total}x de {money(parts.others, false)}
                    </strong>
                    {parts.first !== parts.others && (
                        <> · 1ª de {money(parts.first, false)}</>
                    )}
                    {date && <> · a partir de {format(date, 'dd/MM/yyyy')}</>}
                </p>
            )}
        </div>
    );
}
