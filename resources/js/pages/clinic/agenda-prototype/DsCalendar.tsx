import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import type { Ref } from 'react';

import type { Appointment, CalendarEvent } from '@/domain/clinic';
import { useIsMobile } from '@/hooks/use-mobile';

export type DsCalendarView =
    | 'dayGridMonth'
    | 'timeGridWeek'
    | 'timeGridDay'
    | 'listWeek';

interface DsCalendarProps {
    calendarRef?: Ref<FullCalendar>;
    events: CalendarEvent[];
    initialDate?: Date;
    /** false = a variante desenha a própria barra e controla via ref. */
    showToolbar?: boolean;
    initialView?: DsCalendarView;
    onDatesSet?: (
        title: string,
        view: DsCalendarView,
        start: Date,
        end: Date,
        date: Date,
    ) => void;
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => Promise<void>;
    onEventResize: (id: string, start: string, end: string) => Promise<void>;
}

/** PROTOTYPE — mesmo FullCalendar da agenda, embrulhado na pele `.ds-fc`. */
export function DsCalendar({
    calendarRef,
    events,
    initialDate,
    showToolbar = true,
    initialView,
    onDatesSet,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
}: DsCalendarProps) {
    const isMobile = useIsMobile();

    return (
        <div className="ds-fc">
            <FullCalendar
                ref={calendarRef}
                plugins={[
                    dayGridPlugin,
                    timeGridPlugin,
                    listPlugin,
                    interactionPlugin,
                ]}
                initialView={
                    initialView ?? (isMobile ? 'listWeek' : 'timeGridWeek')
                }
                initialDate={initialDate}
                locale={ptBrLocale}
                headerToolbar={
                    showToolbar
                        ? isMobile
                            ? {
                                  left: 'prev,next',
                                  center: 'title',
                                  right: 'timeGridDay,listWeek',
                              }
                            : {
                                  left: 'prev,next today',
                                  center: 'title',
                                  right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
                              }
                        : false
                }
                buttonText={{
                    today: 'Hoje',
                    month: 'Mês',
                    week: 'Semana',
                    day: 'Dia',
                    list: 'Lista',
                }}
                dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
                datesSet={(info) =>
                    onDatesSet?.(
                        info.view.title,
                        info.view.type as DsCalendarView,
                        info.start,
                        info.end,
                        info.view.calendar.getDate(),
                    )
                }
                events={events}
                editable={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={3}
                weekends={true}
                nowIndicator={true}
                slotMinTime="07:00:00"
                slotMaxTime="21:00:00"
                slotDuration="00:30:00"
                allDaySlot={false}
                height="auto"
                expandRows={true}
                stickyHeaderDates={true}
                longPressDelay={300}
                eventClick={(info) => {
                    onEventClick(
                        info.event.extendedProps.appointment as Appointment,
                    );
                }}
                dateClick={(info) => onDateClick(info.date)}
                eventDrop={async (info) => {
                    const apt = info.event.extendedProps
                        .appointment as Appointment;
                    try {
                        await onEventDrop(
                            apt.id,
                            info.event.startStr,
                            info.event.endStr,
                        );
                    } catch {
                        info.revert();
                    }
                }}
                eventResize={async (info) => {
                    const apt = info.event.extendedProps
                        .appointment as Appointment;
                    try {
                        await onEventResize(
                            apt.id,
                            info.event.startStr,
                            info.event.endStr,
                        );
                    } catch {
                        info.revert();
                    }
                }}
            />
        </div>
    );
}
