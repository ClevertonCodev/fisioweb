import type FullCalendar from '@fullcalendar/react';
import { CalendarPlus } from 'lucide-react';
import { useMemo, useRef } from 'react';

import { DsButton } from '@/components/ds';
import type { AppointmentStatus } from '@/domain/clinic';

import { AgendaRail, useAgendaRail } from './AgendaRail';
import type { AgendaPrototypeProps } from './shared';
import { SOLID, WideAgendaSection, toWideEvent } from './WideAgenda';

const SOLID_SWATCH = Object.fromEntries(
    Object.entries(SOLID).map(([s, color]) => [
        s,
        { surface: color, accent: color },
    ]),
) as Record<AppointmentStatus, { surface: string; accent: string }>;

/**
 * D — calendário grande no estilo da referência (agenda-clone): ocupa a
 * altura toda, só dias úteis por padrão, eventos em bloco sólido; à direita,
 * criar, buscar, minicalendário, resumo por status e agendas visíveis.
 */
export function VariantD({
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
        () => rail.visible.map((apt) => toWideEvent(apt, 'solid')),
        [rail.visible],
    );
    const api = () => calendarRef.current?.getApi();

    return (
        <div className="flex min-h-0 flex-1">
            <WideAgendaSection
                calendarRef={calendarRef}
                rail={rail}
                events={events}
                filteredPatientName={filteredPatientName}
                calendarKey={calendarKey}
                calendarInitialDate={calendarInitialDate}
                onNavigate={(action) => api()?.[action]()}
                onChangeView={(view) => api()?.changeView(view)}
                onEventClick={onEventClick}
                onDateClick={onDateClick}
                onEventDrop={onEventDrop}
                onEventResize={onEventResize}
            />

            <AgendaRail
                rail={rail}
                clinicUsers={clinicUsers}
                statusSwatch={SOLID_SWATCH}
                onSelectDate={(d) => api()?.gotoDate(d)}
                className="border-l border-ds-border-subtle"
                top={
                    <DsButton
                        size="full"
                        icon={<CalendarPlus />}
                        label="Nova consulta"
                        onClick={onNewConsulta}
                    />
                }
            />
        </div>
    );
}
