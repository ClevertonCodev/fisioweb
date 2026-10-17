import type FullCalendar from '@fullcalendar/react';
import { useMemo, useRef } from 'react';

import type { AppointmentStatus } from '@/domain/clinic';

import { AgendaRail, useAgendaRail } from './AgendaRail';
import { DS_STATUS, STATUS_ORDER, type AgendaPrototypeProps } from './shared';
import { WideAgendaSection, toWideEvent } from './WideAgenda';

/** Amostra de cada status igual à consulta suave do calendário. */
const SOFT_SWATCH = Object.fromEntries(
    STATUS_ORDER.map((s) => [
        s,
        { surface: DS_STATUS[s].surface, accent: DS_STATUS[s].accent },
    ]),
) as Record<AppointmentStatus, { surface: string; accent: string }>;

/**
 * A — mistura A + D.
 * Passo 1: a coluna da D (criar, busca, minicalendário, resumo, agendas) à
 * esquerda. Passo 2: título, barra e calendário em altura total da D, mas
 * com as consultas no formato da A (superfície suave + faixa de status) e o
 * texto da D (paciente, tipo, horário, profissional).
 */
export function VariantA({
    appointments,
    clinicUsers,
    filteredPatientName,
    calendarKey,
    calendarInitialDate,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
    onNewConsulta,
}: AgendaPrototypeProps) {
    const calendarRef = useRef<FullCalendar>(null);
    const rail = useAgendaRail(appointments, calendarInitialDate);
    const events = useMemo(
        () => rail.visible.map((apt) => toWideEvent(apt, 'soft')),
        [rail.visible],
    );
    const api = () => calendarRef.current?.getApi();

    return (
        <div className="flex min-h-0 flex-1">
            <AgendaRail
                rail={rail}
                clinicUsers={clinicUsers}
                statusSwatch={SOFT_SWATCH}
                onSelectDate={(d) => api()?.gotoDate(d)}
                className="border-r border-ds-border-subtle"
            />

            <WideAgendaSection
                calendarRef={calendarRef}
                rail={rail}
                events={events}
                filteredPatientName={filteredPatientName}
                onNewConsulta={onNewConsulta}
                calendarKey={calendarKey}
                calendarInitialDate={calendarInitialDate}
                onNavigate={(action) => api()?.[action]()}
                onChangeView={(view) => api()?.changeView(view)}
                onEventClick={onEventClick}
                onDateClick={onDateClick}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
            />
        </div>
    );
}
