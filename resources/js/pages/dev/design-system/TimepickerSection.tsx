import { useState } from 'react';

import { DsTimepicker } from '@/components/ds';

import { CatalogRow, CatalogSection } from './CatalogSection';

export function TimepickerSection() {
    const [time, setTime] = useState('09:30');
    const [committed, setCommitted] = useState('09:30');
    const [start, setStart] = useState('08:00');
    const [end, setEnd] = useState('12:00');

    return (
        <CatalogSection
            id="horario"
            title="Horário"
            description="Digite só os números (0930 vira 09:30) ou escolha na lista. Seta para baixo entra na lista; setas andam, Enter escolhe, Esc fecha."
        >
            <CatalogRow label="Padrão">
                <div className="flex flex-col gap-2">
                    <DsTimepicker
                        value={time}
                        onValueChange={setTime}
                        onChange={setCommitted}
                    />
                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                        value: {time || '—'} · change: {committed || '—'}
                    </span>
                </div>
            </CatalogRow>

            <CatalogRow label="Vazio (não controlado)">
                <DsTimepicker ariaLabel="Horário da sessão" />
            </CatalogRow>

            <CatalogRow label="Com prefix">
                <DsTimepicker
                    prefix="Das"
                    ariaLabel="Início"
                    value={start}
                    onValueChange={setStart}
                />
                <DsTimepicker
                    prefix="Até"
                    ariaLabel="Fim"
                    value={end}
                    onValueChange={setEnd}
                />
            </CatalogRow>

            <CatalogRow label="Disabled">
                <DsTimepicker value="14:00" disabled ariaLabel="Horário fixo" />
                <DsTimepicker disabled ariaLabel="Horário indisponível" />
            </CatalogRow>
        </CatalogSection>
    );
}
