import { useState } from 'react';

import type { RadioValue } from '@/components/ds';
import { DsCheckbox, DsRadio, DsRadioGroup, DsSwitch } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

const DAYS = [
    { value: 'seg', label: 'Segunda' },
    { value: 'qua', label: 'Quarta' },
    { value: 'sex', label: 'Sexta' },
];

export function ChoicesSection() {
    const [accepted, setAccepted] = useState(false);
    const [days, setDays] = useState<string[]>(['seg']);
    const [plan, setPlan] = useState<RadioValue>('mensal');
    const [reminder, setReminder] = useState(true);
    const allDays = days.length === DAYS.length;

    return (
        <CatalogSection
            id="escolhas"
            title="Checkbox, radio e switch"
            description="Sobre Radix: Tab foca, Espaço marca, setas trocam o radio do grupo."
        >
            <CatalogRow label="Checkbox">
                <DsCheckbox
                    label="Aceito os termos"
                    checked={accepted}
                    onCheckedChange={(v) => setAccepted(v as boolean)}
                />
                <DsCheckbox
                    label="Receber lembretes"
                    description="Por WhatsApp, um dia antes da sessão"
                    checked
                />
                <DsCheckbox label="Desabilitado" disabled />
                <DsCheckbox label="Marcado desabilitado" checked disabled />
            </CatalogRow>
            <CatalogRow label="Checkbox em grupo (array) + indeterminate">
                <div className="flex flex-col gap-3">
                    <DsCheckbox
                        label="Todos os dias"
                        checked={allDays}
                        indeterminate={days.length > 0 && !allDays}
                        onCheckedChange={() =>
                            setDays(allDays ? [] : DAYS.map((d) => d.value))
                        }
                    />
                    {DAYS.map((day) => (
                        <DsCheckbox
                            key={day.value}
                            className="pl-7"
                            label={day.label}
                            value={day.value}
                            checked={days}
                            onCheckedChange={(v) => setDays(v as string[])}
                        />
                    ))}
                </div>
            </CatalogRow>
            <CatalogRow label="Radio">
                <DsRadioGroup
                    aria-label="Plano"
                    value={plan}
                    onValueChange={setPlan}
                >
                    <DsRadio value="mensal" label="Mensal" />
                    <DsRadio
                        value="anual"
                        label="Anual"
                        description="Dois meses grátis"
                    />
                    <DsRadio value="avulso" label="Avulso" disabled />
                </DsRadioGroup>
                <DsRadioGroup
                    aria-label="Turno"
                    orientation="horizontal"
                    defaultValue={1}
                >
                    <DsRadio value={1} label="Manhã" />
                    <DsRadio value={2} label="Tarde" />
                    <DsRadio value={3} label="Noite" />
                </DsRadioGroup>
            </CatalogRow>
            <CatalogRow label="Switch">
                <DsSwitch
                    label="Lembrete automático"
                    checked={reminder}
                    onCheckedChange={setReminder}
                />
                <DsSwitch
                    label="Modo compacto"
                    description="Mostra mais linhas por página"
                />
                <DsSwitch label="Desabilitado" disabled />
                <DsSwitch label="Ligado desabilitado" checked disabled />
            </CatalogRow>
        </CatalogSection>
    );
}
