import { useState } from 'react';

import type { DatepickerPreset, DatepickerValue } from '@/components/ds';
import { DsDateField, DsDatepicker } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

function daysFromToday(days: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
}

// Atalhos próprios (substituem os padrão), pensando na agenda da clínica.
const AGENDA_PRESETS: DatepickerPreset[] = [
    {
        key: 'next7',
        label: 'Próximos 7 dias',
        range: () => ({ start: daysFromToday(0), end: daysFromToday(6) }),
    },
    {
        key: 'next30',
        label: 'Próximos 30 dias',
        range: () => ({ start: daysFromToday(0), end: daysFromToday(29) }),
    },
    {
        key: 'nextMonth',
        label: 'Mês que vem',
        range: () => {
            const today = new Date();
            return {
                start: new Date(today.getFullYear(), today.getMonth() + 1, 1),
                end: new Date(today.getFullYear(), today.getMonth() + 2, 0),
            };
        },
    },
];

function describeValue(value: DatepickerValue) {
    if (!value) return 'nada aplicado';
    if (value instanceof Date) return value.toLocaleDateString('pt-BR');
    const fmt = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR') : '…');
    return `${fmt(value.start)} até ${fmt(value.end)}`;
}

function Applied({ value }: { value: DatepickerValue }) {
    return (
        <span className="self-center font-ds-mono text-ds-caption text-ds-content-muted">
            {describeValue(value)}
        </span>
    );
}

export function DatepickerSection() {
    const [single, setSingle] = useState<DatepickerValue>(null);
    const [range, setRange] = useState<DatepickerValue>(null);
    const [limited, setLimited] = useState<DatepickerValue>(null);
    const [limitedRange, setLimitedRange] = useState<DatepickerValue>(null);
    const [agenda, setAgenda] = useState<DatepickerValue>(null);
    const [typed, setTyped] = useState('');

    return (
        <CatalogSection
            id="data"
            title="Data"
            description="Single fecha ao escolher o dia; range espera o Aplicar (Cancelar, Esc ou clique fora descartam). Setas andam pelos dias, Enter escolhe."
        >
            <CatalogRow label="Single">
                <DsDatepicker
                    mode="single"
                    placeholder="Data da avaliação"
                    value={single}
                    onValueChange={setSingle}
                />
                <Applied value={single} />
            </CatalogRow>

            <CatalogRow label="Range com atalhos padrão">
                <DsDatepicker
                    mode="range"
                    value={range}
                    onValueChange={setRange}
                />
                <Applied value={range} />
            </CatalogRow>

            <CatalogRow label="Com limites (hoje até +30 dias)">
                <DsDatepicker
                    mode="single"
                    placeholder="Próxima sessão"
                    minDate={daysFromToday(0)}
                    maxDate={daysFromToday(30)}
                    value={limited}
                    onValueChange={setLimited}
                />
                <DsDatepicker
                    mode="range"
                    placeholder="Até hoje"
                    maxDate={daysFromToday(0)}
                    value={limitedRange}
                    onValueChange={setLimitedRange}
                />
            </CatalogRow>

            <CatalogRow label="Atalhos próprios (presets)">
                <DsDatepicker
                    mode="range"
                    placeholder="Período da agenda"
                    presets={AGENDA_PRESETS}
                    value={agenda}
                    onValueChange={setAgenda}
                />
                <Applied value={agenda} />
            </CatalogRow>

            <CatalogRow label="Campo digitável (DsDateField)">
                <div className="w-64">
                    <DsDateField
                        label="Data de nascimento"
                        value={typed}
                        onChange={setTyped}
                    />
                </div>
                <span className="self-center font-ds-mono text-ds-caption text-ds-content-muted">
                    {typed || 'AAAA-MM-DD'}
                </span>
            </CatalogRow>

            <CatalogRow label="Preenchido e desabilitado">
                <DsDatepicker
                    mode="range"
                    value={{ start: daysFromToday(-6), end: daysFromToday(0) }}
                />
                <DsDatepicker mode="single" value={daysFromToday(0)} disabled />
            </CatalogRow>
        </CatalogSection>
    );
}
