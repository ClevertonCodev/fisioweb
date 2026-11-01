/**
 * Exportar os lançamentos do período em Excel, PDF ou CSV (React Hook Form +
 * Zod). Em "Escolher datas", "De" e "Até" são dois seletores de um mês só
 * (lado a lado no desktop, empilhados no celular), como no assistente de
 * programa: o seletor de período abre dois meses e não cabe no celular.
 * Cada erro aparece embaixo do próprio campo.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import { useId, type Ref } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import {
    financeExportFormDefaults,
    financeExportFormSchema,
    toFinanceExportParams,
    type FinanceExportFormValues,
} from '@/application/clinic/finance-export-form';
import { useFinanceExport } from '@/application/clinic/use-finance-export';
import { DsButton, dsCn, DsDatepicker, DsModal } from '@/components/ds';

type Range = FinanceExportFormValues['range'];
type Format = FinanceExportFormValues['format'];

export function ExportModal({ onClose }: { onClose: () => void }) {
    const form = useForm<FinanceExportFormValues>({
        resolver: zodResolver(financeExportFormSchema),
        defaultValues: financeExportFormDefaults,
    });
    const exp = useFinanceExport();
    const submit = form.handleSubmit((values) =>
        exp.mutate(toFinanceExportParams(values), { onSuccess: onClose }),
    );

    const formats: {
        key: Format;
        label: string;
        text: string;
        icon: React.ReactNode;
    }[] = [
        {
            key: 'xlsx',
            label: 'Excel',
            text: 'Para mexer nos números',
            icon: <FileSpreadsheet />,
        },
        {
            key: 'pdf',
            label: 'PDF',
            text: 'Para imprimir ou mandar ao contador',
            icon: <FileText />,
        },
        {
            key: 'csv',
            label: 'CSV',
            text: 'Para outro sistema',
            icon: <Table2 />,
        },
    ];
    const ranges: { key: Range; label: string }[] = [
        { key: 'current_month', label: 'Este mês' },
        { key: 'previous_month', label: 'Mês passado' },
        { key: 'custom', label: 'Escolher datas' },
    ];
    const range = useWatch({ control: form.control, name: 'range' });
    const format = useWatch({ control: form.control, name: 'format' });
    const start = useWatch({ control: form.control, name: 'start' });
    const fieldId = useId();

    return (
        <DsModal
            open
            onOpenChange={(o) => !o && onClose()}
            size="md"
            title="Exportar lançamentos"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={onClose}
                    />
                    <DsButton
                        label="Baixar"
                        loading={exp.isPending}
                        onClick={() => void submit()}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium">Período</span>
                    <div className="flex flex-wrap gap-2">
                        {ranges.map((r) => (
                            <button
                                key={r.key}
                                type="button"
                                aria-pressed={range === r.key}
                                onClick={() => {
                                    form.setValue('range', r.key);
                                    form.clearErrors(['start', 'end']);
                                }}
                                className={dsCn(
                                    'cursor-pointer rounded-ds-pill border px-3 py-1.5 text-ds-body-xs',
                                    range === r.key
                                        ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-content-on-brand ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                        : 'border-ds-border-default text-ds-content-secondary',
                                )}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                    {range === 'custom' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Controller
                                control={form.control}
                                name="start"
                                render={({ field, fieldState }) => (
                                    <DateField
                                        id={`${fieldId}-start`}
                                        label="De"
                                        fieldRef={field.ref}
                                        value={field.value}
                                        onChange={(v) => {
                                            field.onChange(v);
                                            if (form.formState.isSubmitted) {
                                                void form.trigger('end');
                                            }
                                        }}
                                        error={fieldState.error?.message}
                                    />
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="end"
                                render={({ field, fieldState }) => (
                                    <DateField
                                        id={`${fieldId}-end`}
                                        label="Até"
                                        fieldRef={field.ref}
                                        minDate={start ?? undefined}
                                        value={field.value}
                                        onChange={field.onChange}
                                        error={fieldState.error?.message}
                                    />
                                )}
                            />
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <span className="text-ds-body-xs font-medium">Formato</span>
                    <div
                        role="radiogroup"
                        aria-label="Formato"
                        className="grid gap-2 sm:grid-cols-3"
                    >
                        {formats.map((f) => (
                            <button
                                key={f.key}
                                type="button"
                                role="radio"
                                aria-checked={format === f.key}
                                onClick={() => form.setValue('format', f.key)}
                                className={dsCn(
                                    'flex cursor-pointer flex-col items-start gap-1.5 rounded-ds-lg border p-3 text-left transition-colors [&_svg]:size-5',
                                    format === f.key
                                        ? 'border-ds-primary-80 bg-ds-surface-brand-subtle ds-dark:border-ds-primary-60'
                                        : 'border-ds-border-subtle hover:border-ds-border-brand-subtle',
                                )}
                            >
                                <span className="text-ds-content-brand ds-dark:text-ds-primary-60">
                                    {f.icon}
                                </span>
                                <span className="text-ds-body-xs font-semibold">
                                    {f.label}
                                </span>
                                <span className="text-ds-caption text-ds-content-muted">
                                    {f.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </DsModal>
    );
}

/** Um campo de data (`DsDatepicker` single) com rótulo e erro embaixo. */
function DateField({
    id,
    label,
    value,
    onChange,
    error,
    minDate,
    fieldRef,
}: {
    id: string;
    label: string;
    value: Date | null;
    onChange: (value: Date | null) => void;
    error?: string;
    minDate?: Date;
    fieldRef: Ref<HTMLButtonElement>;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <label
                htmlFor={id}
                className="text-ds-caption text-ds-content-secondary"
            >
                {label}
            </label>
            <DsDatepicker
                id={id}
                ref={fieldRef}
                mode="single"
                placeholder="Escolha a data"
                className="w-full"
                minDate={minDate}
                value={value}
                onValueChange={(v) => onChange(v instanceof Date ? v : null)}
            />
            {error && (
                <span
                    role="alert"
                    className="text-ds-caption text-ds-status-danger-content"
                >
                    {error}
                </span>
            )}
        </div>
    );
}
