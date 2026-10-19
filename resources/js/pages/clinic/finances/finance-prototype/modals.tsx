/**
 * PROTÓTIPO (descartável): exportar e saldo inicial. Exportar é real (só
 * baixa o arquivo, usando a API da v1); o saldo inicial é stub ao salvar.
 */
import { FileSpreadsheet, FileText, Table2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useFinanceExport } from '@/application/clinic/use-finance-export';
import {
    DsButton,
    dsCn,
    DsDatepicker,
    DsModal,
    DsMoneyInput,
} from '@/components/ds';
import type { DateRange } from '@/components/ds/datepicker/types';

import { money, periodLabel } from './data';

type Range = 'current_month' | 'previous_month' | 'custom';
type Format = 'csv' | 'xlsx' | 'pdf';

function isoDay(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ExportModal({ onClose }: { onClose: () => void }) {
    const [range, setRange] = useState<Range>('current_month');
    const [custom, setCustom] = useState<DateRange | null>(null);
    const [format, setFormat] = useState<Format>('xlsx');
    const exp = useFinanceExport();

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
    const customOk = range !== 'custom' || (custom?.start && custom?.end);

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
                        disabled={!customOk}
                        onClick={() =>
                            exp.mutate(
                                {
                                    format,
                                    range,
                                    from:
                                        range === 'custom' && custom?.start
                                            ? isoDay(custom.start)
                                            : undefined,
                                    to:
                                        range === 'custom' && custom?.end
                                            ? isoDay(custom.end)
                                            : undefined,
                                },
                                { onSuccess: onClose },
                            )
                        }
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
                                onClick={() => setRange(r.key)}
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
                        <DsDatepicker
                            mode="range"
                            value={custom}
                            onValueChange={(v) =>
                                setCustom(v && !(v instanceof Date) ? v : null)
                            }
                        />
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
                                onClick={() => setFormat(f.key)}
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

export function OpeningBalanceModal({
    period,
    current,
    onClose,
}: {
    period: string;
    current: number;
    onClose: () => void;
}) {
    const [value, setValue] = useState<number | null>(current);
    return (
        <DsModal
            open
            onOpenChange={(o) => !o && onClose()}
            size="sm"
            title="Saldo inicial"
            meta={periodLabel(period)}
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={onClose}
                    />
                    <DsButton
                        label="Salvar"
                        onClick={() => {
                            toast.success(
                                `Protótipo: saldo inicial de ${money(value ?? 0, false)} não foi salvo.`,
                            );
                            onClose();
                        }}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-3">
                <p className="text-ds-body-sm text-ds-content-secondary">
                    Quanto havia em caixa e no banco no primeiro dia do mês. É a
                    base do "Disponível agora".
                </p>
                <DsMoneyInput
                    label="Saldo no dia 1"
                    value={value}
                    onValueChange={setValue}
                />
            </div>
        </DsModal>
    );
}
