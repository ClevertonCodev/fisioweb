import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';

import type { Appointment, CalendarEvent } from '@/domain/clinic';
import { useIsMobile } from '@/hooks/use-mobile';

interface CalendarViewProps {
    events: CalendarEvent[];
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => void;
    onEventResize: (id: string, start: string, end: string) => void;
}

export function CalendarView({
    events,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
}: CalendarViewProps) {
    const isMobile = useIsMobile();

    return (
        <FullCalendar
            plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
            ]}
            initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
            locale={ptBrLocale}
            headerToolbar={
                isMobile
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
            }
            buttonText={{
                today: 'Hoje',
                month: 'Mês',
                week: 'Semana',
                day: 'Dia',
                list: 'Lista',
            }}
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
                const appointment = info.event.extendedProps
                    .appointment as Appointment;
                onEventClick(appointment);
            }}
            dateClick={(info) => {
                onDateClick(info.date);
            }}
            eventDrop={(info) => {
                const apt = info.event.extendedProps.appointment as Appointment;
                onEventDrop(apt.id, info.event.startStr, info.event.endStr);
            }}
            eventResize={(info) => {
                const apt = info.event.extendedProps.appointment as Appointment;
                onEventResize(apt.id, info.event.startStr, info.event.endStr);
            }}
        />
    );
}
