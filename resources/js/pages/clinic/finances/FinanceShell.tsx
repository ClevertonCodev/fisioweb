/**
 * Finanças no DS v2, nas rotas /clinica/financas, /financas/categorias e
 * /financas/lixeira (as duas últimas abrem a aba Configurações na seção
 * certa). A aba vem de ?aba= (lancamentos, relatorio, configuracoes).
 *
 * Lançamentos é o calendário de caixa (o mês em grade + a receber e a
 * pagar). Comuns: resumo do mês, lançamento (criar/editar), exportar,
 * saldo inicial, relatório e configurações.
 */
import { Download, Eye, EyeOff, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { useFinanceSummary } from '@/application/clinic/use-finance-transactions';
import { useFinanceValuesVisibility } from '@/application/clinic/use-finance-values-visibility';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsTabs } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { FinancialTransaction } from '@/domain/clinic/finance';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import { CashCalendar } from './CashCalendar';
import { ExportModal } from './ExportModal';
import { periodOf } from './finance-format';
import { MonthSwitcher, SummaryStrip } from './finance-parts';
import { OpeningBalanceModal } from './OpeningBalanceModal';
import { ReportTab } from './ReportTab';
import { SettingsTab, type SettingsSection } from './SettingsTab';
import { TransactionModal, type Draft } from './TransactionModal';

const TABS = [
    { key: 'lancamentos', label: 'Lançamentos' },
    { key: 'relatorio', label: 'Relatório' },
    { key: 'configuracoes', label: 'Configurações' },
];

export function FinanceShell({ focus }: { focus?: SettingsSection }) {
    const [params, setParams] = useSearchParams();
    const asked = params.get('aba');
    const tab = TABS.some((t) => t.key === asked)
        ? asked!
        : focus
          ? 'configuracoes'
          : 'lancamentos';
    const setTab = (key: string) =>
        setParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.set('aba', key);
                return next;
            },
            { replace: true },
        );

    const [period, setPeriod] = useState(() => periodOf(new Date()));
    const { hidden, toggle } = useFinanceValuesVisibility();
    const isMobile = useIsMobile();
    const summary = useFinanceSummary({ period });
    // Saldo inicial: só o administrador edita (a API também barra).
    const { user } = useAuth();
    const canEditOpening = can.manageFinanceSettings(user?.role);

    const [draft, setDraft] = useState<Draft | null>(null);
    const [exporting, setExporting] = useState(false);
    const [opening, setOpening] = useState(false);
    const open = (t: FinancialTransaction) =>
        setDraft({ type: t.type, editing: t });

    const listProps = { period, hidden, onOpen: open };

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 pt-6 pb-24 sm:px-6 sm:pt-8">
                    <header className="flex flex-wrap items-center gap-3">
                        <div className="mr-auto">
                            <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                Finanças
                            </h1>
                            <p className="text-ds-caption text-ds-content-secondary sm:text-ds-body-sm">
                                Entradas, saídas e o caixa da clínica.
                            </p>
                        </div>
                        {/* Celular: mês + olho + exportar numa linha; os dois
                            botões de lançar lado a lado embaixo. */}
                        <div className="flex w-full items-center gap-1 sm:w-auto">
                            <div className="flex-1 sm:flex-none">
                                <MonthSwitcher
                                    period={period}
                                    onChange={setPeriod}
                                />
                            </div>
                            <DsButton
                                variant="tertiary"
                                iconPosition="only"
                                icon={hidden ? <Eye /> : <EyeOff />}
                                label={
                                    hidden
                                        ? 'Mostrar valores'
                                        : 'Esconder valores'
                                }
                                onClick={toggle}
                            />
                            <DsButton
                                variant="secondary"
                                iconPosition={isMobile ? 'only' : 'left'}
                                icon={<Download />}
                                label="Exportar"
                                onClick={() => setExporting(true)}
                            />
                        </div>
                        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                            <DsButton
                                size={isMobile ? 'full' : 'md'}
                                variant="secondary"
                                iconPosition="left"
                                icon={<Minus />}
                                label="Nova saída"
                                onClick={() => setDraft({ type: 'saida' })}
                            />
                            <DsButton
                                size={isMobile ? 'full' : 'md'}
                                iconPosition="left"
                                icon={<Plus />}
                                label="Nova entrada"
                                onClick={() => setDraft({ type: 'entrada' })}
                            />
                        </div>
                    </header>

                    <div className="overflow-x-auto">
                        <DsTabs
                            size={isMobile ? 'sm' : 'md'}
                            tabs={TABS}
                            value={tab}
                            onValueChange={setTab}
                        />
                    </div>

                    {tab === 'lancamentos' && (
                        <>
                            <SummaryStrip
                                s={summary.data}
                                hidden={hidden}
                                loading={summary.isLoading}
                                onEditOpening={
                                    canEditOpening
                                        ? () => setOpening(true)
                                        : undefined
                                }
                            />
                            <CashCalendar {...listProps} />
                        </>
                    )}
                    {tab === 'relatorio' && (
                        <ReportTab period={period} hidden={hidden} />
                    )}
                    {tab === 'configuracoes' && (
                        <SettingsTab
                            period={period}
                            hidden={hidden}
                            openingBalance={summary.data?.openingBalance}
                            openingBalanceSource={
                                summary.data?.openingBalanceSource
                            }
                            onEditOpening={() => setOpening(true)}
                            focus={focus}
                        />
                    )}
                </div>
            </div>

            {draft && (
                <TransactionModal
                    key={draft.editing?.id ?? draft.type}
                    draft={draft}
                    period={period}
                    onClose={() => setDraft(null)}
                />
            )}
            {exporting && <ExportModal onClose={() => setExporting(false)} />}
            {opening && canEditOpening && (
                <OpeningBalanceModal
                    period={period}
                    current={summary.data?.openingBalance ?? 0}
                    source={summary.data?.openingBalanceSource ?? 'computed'}
                    onClose={() => setOpening(false)}
                />
            )}
        </ClinicLayout>
    );
}
