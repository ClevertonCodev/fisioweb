/**
 * Saldo inicial do mês, só do administrador. Digitar substitui o calculado
 * daquele mês (e os seguintes partem dele); num mês digitado, "Voltar ao
 * calculado" apaga o valor e o mês volta a vir do mês anterior.
 */
import { RotateCcw } from 'lucide-react';
import { useState } from 'react';

import {
    useClearOpeningBalance,
    useSaveOpeningBalance,
} from '@/application/clinic/use-finance-opening-balance';
import { DsButton, DsModal, DsMoneyInput } from '@/components/ds';
import type { OpeningBalanceSource } from '@/domain/clinic/finance';

import { periodLabel } from './finance-format';

export function OpeningBalanceModal({
    period,
    current,
    source,
    onClose,
}: {
    period: string;
    current: number;
    source: OpeningBalanceSource;
    onClose: () => void;
}) {
    const [value, setValue] = useState<number | null>(current);
    const [error, setError] = useState<string | null>(null);
    const save = useSaveOpeningBalance();
    const clear = useClearOpeningBalance();
    const busy = save.isPending || clear.isPending;

    const submit = () => {
        if (value === null) {
            setError('Informe o saldo do dia 1.');
            return;
        }
        const [year, month] = period.split('-').map(Number);
        save.mutate({ year, month, amount: value }, { onSuccess: onClose });
    };

    return (
        <DsModal
            open
            onOpenChange={(o) => !o && !busy && onClose()}
            size="sm"
            title="Saldo inicial"
            meta={periodLabel(period)}
            footer={
                <div className="flex w-full flex-wrap items-center justify-end gap-3">
                    {source === 'typed' && (
                        <DsButton
                            variant="tertiary"
                            iconPosition="left"
                            icon={<RotateCcw />}
                            label="Voltar ao calculado"
                            className="mr-auto"
                            disabled={busy}
                            loading={clear.isPending}
                            onClick={() =>
                                clear.mutate(period, { onSuccess: onClose })
                            }
                        />
                    )}
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={busy}
                        onClick={onClose}
                    />
                    <DsButton
                        label="Salvar"
                        disabled={busy}
                        loading={save.isPending}
                        onClick={submit}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-3">
                <p className="text-ds-body-sm text-ds-content-secondary">
                    Quanto havia em caixa e no banco no primeiro dia do mês. É a
                    base do "Disponível agora".
                </p>
                <p className="text-ds-caption text-ds-content-muted">
                    {source === 'typed'
                        ? 'Este mês tem um valor digitado. Os meses seguintes partem dele.'
                        : 'Hoje o valor é calculado do mês anterior. Digitar um valor substitui só este mês.'}
                </p>
                <DsMoneyInput
                    label="Saldo no dia 1"
                    value={value}
                    onValueChange={(v) => {
                        setValue(v);
                        setError(null);
                    }}
                    state={error ? 'error' : undefined}
                    helper={error ?? undefined}
                />
            </div>
        </DsModal>
    );
}
