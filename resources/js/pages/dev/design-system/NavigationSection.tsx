import { CalendarDays, FileText, Lock, User } from 'lucide-react';
import { useState } from 'react';

import type { Tab, TabsSize } from '@/components/ds';
import {
    DsCollapse,
    DsPagination,
    DsSteps,
    DsTabs,
    DsTabsPanel,
} from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const TABS: Tab[] = [
    { key: 'dados', label: 'Dados', icon: <User /> },
    { key: 'agenda', label: 'Agenda', icon: <CalendarDays /> },
    { key: 'prontuario', label: 'Prontuário', icon: <FileText /> },
    { key: 'financeiro', label: 'Financeiro', icon: <Lock />, disabled: true },
];

const STEPS = [
    { label: 'Paciente', description: 'Dados básicos' },
    { label: 'Exercícios', description: 'Escolha e séries' },
    { label: 'Agenda' },
    { label: 'Revisão' },
];

const COLLAPSE_ITEMS = [
    {
        key: 'anamnese',
        title: 'Anamnese',
        content: 'Queixa principal, histórico e medicamentos.',
    },
    {
        key: 'avaliacao',
        title: 'Avaliação física',
        content: 'Amplitude de movimento, força e testes especiais.',
    },
    {
        key: 'conduta',
        title: 'Conduta',
        content: 'Plano de tratamento e frequência.',
    },
];

export function NavigationSection() {
    const [tab, setTab] = useState('dados');
    const [step, setStep] = useState(1);
    const [page, setPage] = useState(1);
    const [manyPage, setManyPage] = useState(10);

    return (
        <CatalogSection
            id="navegacao"
            title="Collapse, abas, passos e paginação"
            description="Setas trocam a aba e passam entre os títulos do collapse; Enter e Espaço abrem e fecham."
        >
            <CatalogRow label="Abas (sm, md, lg)">
                <div className="flex w-full flex-col gap-4">
                    {(['sm', 'md', 'lg'] as TabsSize[]).map((size) => (
                        <DsTabs
                            key={size}
                            aria-label={`Abas ${size}`}
                            size={size}
                            tabs={TABS}
                            value={tab}
                            onValueChange={setTab}
                        />
                    ))}
                </div>
            </CatalogRow>
            <CatalogRow label="Abas com painel (DsTabsPanel)">
                <div className="w-full">
                    <DsTabs
                        aria-label="Ficha do paciente"
                        tabs={TABS.slice(0, 3)}
                    >
                        <DsTabsPanel value="dados">
                            Nome, contato e convênio.
                        </DsTabsPanel>
                        <DsTabsPanel value="agenda">
                            Próximas sessões.
                        </DsTabsPanel>
                        <DsTabsPanel value="prontuario">
                            Evoluções e anexos.
                        </DsTabsPanel>
                    </DsTabs>
                </div>
            </CatalogRow>
            <CatalogRow label="Collapse">
                <div className="w-full max-w-xl">
                    <DsCollapse items={COLLAPSE_ITEMS} />
                </div>
                <div className="w-full max-w-xl">
                    <DsCollapse
                        mode="step"
                        currentStep={1}
                        items={COLLAPSE_ITEMS}
                    />
                </div>
            </CatalogRow>
            <CatalogRow label="Passos">
                <div className="flex w-full flex-col gap-6">
                    <DsSteps steps={STEPS} current={step} />
                    <div className="flex gap-2">
                        {STEPS.map((s, i) => (
                            <button
                                key={s.label}
                                type="button"
                                onClick={() => setStep(i)}
                                className="cursor-pointer rounded-ds-sm border border-ds-border-subtle px-2 py-1 text-ds-caption text-ds-content-muted"
                            >
                                Ir para {i + 1}
                            </button>
                        ))}
                    </div>
                    <DsSteps steps={STEPS} current={2} vertical />
                </div>
            </CatalogRow>
            <CatalogRow label="Paginação">
                <div className="flex w-full flex-col gap-6">
                    <DsPagination
                        total={95}
                        page={page}
                        onPageChange={setPage}
                    />
                    <DsPagination
                        total={400}
                        page={manyPage}
                        onPageChange={setManyPage}
                        itemLabel="pacientes"
                    />
                    <DsPagination
                        total={400}
                        page={manyPage}
                        onPageChange={setManyPage}
                        compact
                    />
                </div>
            </CatalogRow>
        </CatalogSection>
    );
}
