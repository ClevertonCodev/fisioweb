/**
 * Seção "Saldo inicial" das Configurações de Finanças, só do administrador
 * (a API também barra a secretária com 403). Mostra o saldo do dia 1 do mês
 * na tela, se ele foi calculado do mês anterior ou digitado, e abre o mesmo
 * modal do resumo do mês (OpeningBalanceModal), que a FinanceShell monta.
 */
import { useId } from 'react';

import { can } from '@/application/clinic/permissions';
import { DsBadge, DsButton } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { OpeningBalanceSource } from '@/domain/clinic/finance';

import { money, periodLabel } from './finance-format';

export function FinanceOpeningBalanceSection({
    className,
    period,
    hidden,
    amount,
    source,
    onEdit,
}: {
    className?: string;
    period: string;
    hidden: boolean;
    /** Undefined enquanto o resumo do mês carrega. */
    amount: number | undefined;
    source: OpeningBalanceSource | undefined;
    onEdit: () => void;
}) {
    const headingId = useId();
    const { user } = useAuth();
    if (!can.manageFinanceSettings(user?.role)) return null;

    return (
        <section
            id="fin-saldo"
            aria-labelledby={headingId}
            className={className}
        >
            <div className="flex flex-wrap items-center gap-3">
                <div className="mr-auto min-w-0">
                    <h3 id={headingId} className="text-ds-body-emphasis">
                        Saldo inicial
                    </h3>
                    <p className="text-ds-caption text-ds-content-muted">
                        O que havia em caixa no dia 1 de{' '}
                        {periodLabel(period).toLowerCase()}. Sem valor digitado,
                        vem do disponível do fim do mês anterior.
                    </p>
                </div>
                <span className="flex items-center gap-2">
                    <span className="font-ds-mono text-ds-h4 font-semibold">
                        {amount === undefined ? '…' : money(amount, hidden)}
                    </span>
                    {source && (
                        <DsBadge
                            variant={source === 'typed' ? 'primary' : 'default'}
                        >
                            {source === 'typed'
                                ? 'Digitado'
                                : 'Calculado do mês anterior'}
                        </DsBadge>
                    )}
                </span>
                <DsButton
                    variant="secondary"
                    label="Alterar"
                    aria-label="Alterar saldo inicial"
                    onClick={onEdit}
                />
            </div>
        </section>
    );
}
