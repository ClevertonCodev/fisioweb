/**
 * Aba Configurações, que junta o que na v1 estava espalhado (aba,
 * /financas/categorias e /financas/lixeira): categorias de entrada e de saída
 * e saldo inicial do mês (só o administrador; cada seção confere o papel) e a
 * lixeira com restaurar (administrador e secretária). Repasses aos
 * profissionais não entram (feature própria, fora da 013).
 */
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import type { OpeningBalanceSource } from '@/domain/clinic/finance';

import { FinanceCategoriesSection } from './FinanceCategoriesSection';
import { FinanceOpeningBalanceSection } from './FinanceOpeningBalanceSection';
import { FinanceTrashSection } from './FinanceTrashSection';

export type SettingsSection = 'categorias' | 'saldo' | 'lixeira';

/**
 * Rola até a seção pedida (vindo de /financas/categorias ou /lixeira) uma vez
 * só, depois que as buscas de Finanças terminam: rolar antes deixaria a
 * lixeira fora do lugar quando as categorias de cima carregam e crescem.
 */
function useScrollToSection(focus: SettingsSection | undefined) {
    const qc = useQueryClient();
    const fetching = useIsFetching({ queryKey: ['finance'] });
    const done = useRef(false);

    useEffect(() => {
        if (!focus || done.current) return;
        if (qc.isFetching({ queryKey: ['finance'] }) > 0) return;
        const target = document.getElementById(`fin-${focus}`);
        if (!target) return;
        done.current = true;
        target.scrollIntoView({ block: 'start' });
    }, [focus, fetching, qc]);
}

export function SettingsTab({
    period,
    hidden,
    openingBalance,
    openingBalanceSource,
    onEditOpening,
    focus,
}: {
    period: string;
    hidden: boolean;
    openingBalance: number | undefined;
    openingBalanceSource: OpeningBalanceSource | undefined;
    onEditOpening: () => void;
    /** Rola até a seção (vindo de /financas/categorias ou /lixeira). */
    focus?: SettingsSection;
}) {
    useScrollToSection(focus);

    const card =
        'scroll-mt-4 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-xs';

    return (
        <div className="flex flex-col gap-4">
            <FinanceCategoriesSection className={card} />
            <FinanceOpeningBalanceSection
                className={card}
                period={period}
                hidden={hidden}
                amount={openingBalance}
                source={openingBalanceSource}
                onEdit={onEditOpening}
            />
            <FinanceTrashSection className={card} hidden={hidden} />
        </div>
    );
}
