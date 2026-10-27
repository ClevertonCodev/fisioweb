import type {
    DatesSetArg,
    DayHeaderContentArg,
    EventContentArg,
    EventInput,
} from '@fullcalendar/core';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import {
    ArrowLeft,
    ArrowRight,
    CalendarPlus,
    Settings,
    SlidersHorizontal,
} from 'lucide-react';
import { useCallback, useEffect, useState, type RefObject } from 'react';

import { DsButton, DsDropdown, dsCn } from '@/components/ds';
import type { AgendaView, Appointment } from '@/domain/clinic';
import { AGENDA_VIEWS, isTerminalAppointmentStatus } from '@/domain/clinic';

import {
    DS_STATUS,
    capitalize,
    formatTime,
    monthTitle,
    statusLabel,
} from './agenda-shared';

const VIEW_LABELS: Record<AgendaView, string> = {
    listWeek: 'Atendimentos',
    timeGridDay: 'Dia',
    timeGridThreeDay: '3 dias',
    timeGridWeek: 'Semana',
    dayGridMonth: 'Mês',
};

const VIEW_ITEMS = AGENDA_VIEWS.map((key) => ({
    key,
    label: VIEW_LABELS[key],
}));

const DISPLAY_ITEMS = [{ key: 'weekends', label: 'Mostrar fins de semana' }];

// Opções estáveis fora do componente: objeto novo a cada render faz o
// FullCalendar reaplicar opções e disparar datesSet em loop.
const PLUGINS = [timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin];
const VIEWS = {
    timeGridThreeDay: { type: 'timeGrid', duration: { days: 3 } },
};
const TIME_FORMAT = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
} as const;
const BUSINESS_HOURS = {
    daysOfWeek: [1, 2, 3, 4, 5],
    startTime: '07:00',
    endTime: '20:00',
};
const WEEKENDS_HIDDEN = [0, 6];
const NO_HIDDEN_DAYS: number[] = [];

/**
 * Consulta com fundo suave + faixa de status (classe `ds-ev-soft` no CSS) e
 * texto na cor do status.
 */
export function toAgendaEvent(apt: Appointment): EventInput {
    const tone = DS_STATUS[apt.status];
    return {
        id: apt.id,
        title: apt.patientName || apt.title || 'Consulta',
        start: apt.startsAt,
        end: apt.endsAt,
        backgroundColor: tone.surface,
        borderColor: tone.accent,
        textColor: tone.content,
        classNames: ['ds-ev-soft'],
        editable: !isTerminalAppointmentStatus(apt.status),
        extendedProps: { appointment: apt },
    };
}

interface AgendaCalendarProps {
    calendarRef: RefObject<FullCalendar | null>;
    events: EventInput[];
    focusDate: Date;
    view: AgendaView;
    onViewChange: (view: AgendaView) => void;
    showWeekends: boolean;
    onShowWeekendsChange: (show: boolean) => void;
    filteredPatientName?: string;
    onNewConsulta: () => void;
    /** Abre a coluna em gaveta (só abaixo de `lg`). */
    onOpenFilters: () => void;
    calendarKey: string;
    calendarInitialDate?: Date;
    onDatesSet: (start: Date, end: Date, focus: Date) => void;
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => Promise<void>;
    onEventResize: (id: string, start: string, end: string) => Promise<void>;
}

/** Título, barra (Hoje ← → mês, visão, exibição) e o FullCalendar em altura total. */
export function AgendaCalendar({
    calendarRef,
    events,
    focusDate,
    view,
    onViewChange,
    showWeekends,
    onShowWeekendsChange,
    filteredPatientName,
    onNewConsulta,
    onOpenFilters,
    calendarKey,
    calendarInitialDate,
    onDatesSet,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
}: AgendaCalendarProps) {
    const [scrollTime] = useState(() => {
        const hour = Math.min(Math.max(new Date().getHours() - 1, 6), 18);
        return `${String(hour).padStart(2, '0')}:00:00`;
    });
    const api = () => calendarRef.current?.getApi();

    // `initialView` só vale na montagem (inclusive quando a `key` remonta o
    // calendário); trocar a visão depois disso passa pelo `changeView`.
    useEffect(() => {
        const calendar = calendarRef.current?.getApi();
        if (calendar && calendar.view.type !== view) {
            calendar.changeView(view);
        }
    }, [calendarRef, view]);

    const handleDatesSet = useCallback(
        (arg: DatesSetArg) =>
            onDatesSet(arg.start, arg.end, arg.view.calendar.getDate()),
        [onDatesSet],
    );

    return (
        <section className="flex min-w-0 flex-1 flex-col bg-ds-surface-default">
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-4 pt-5 pb-4 md:px-6">
                <div className="min-w-0 space-y-4">
                    <div className="min-w-0">
                        <h1 className="text-ds-page-title font-semibold">
                            Agenda
                        </h1>
                        {filteredPatientName && (
                            <p className="text-ds-body-xs text-ds-content-muted">
                                Agendamentos de {filteredPatientName}
                            </p>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="lg:hidden">
                            <DsButton
                                variant="secondary"
                                iconPosition="left"
                                icon={<SlidersHorizontal />}
                                label="Filtros"
                                onClick={onOpenFilters}
                            />
                        </div>
                        <DsButton
                            variant="secondary"
                            label="Hoje"
                            onClick={() => api()?.today()}
                        />
                        <DsButton
                            variant="tertiary"
                            iconPosition="only"
                            icon={<ArrowLeft />}
                            label="Anterior"
                            onClick={() => api()?.prev()}
                        />
                        <DsButton
                            variant="tertiary"
                            iconPosition="only"
                            icon={<ArrowRight />}
                            label="Próximo"
                            onClick={() => api()?.next()}
                        />
                        <span className="ml-1 text-ds-body-lg font-medium">
                            {monthTitle(focusDate)}
                        </span>
                    </div>
                </div>

                {/* Nova consulta com a mesma largura de visão + Exibição. */}
                <div className="flex flex-col items-stretch gap-3">
                    <DsButton
                        iconPosition="left"
                        size="lg"
                        icon={<CalendarPlus />}
                        label="Nova consulta"
                        onClick={onNewConsulta}
                        className="w-full"
                    />
                    <div className="flex items-center gap-2">
                        <DsDropdown
                            items={VIEW_ITEMS}
                            value={view}
                            onValueChange={(v) => onViewChange(v as AgendaView)}
                            menuAlign="right"
                            label="Visão do calendário"
                        />
                        <DsDropdown
                            items={DISPLAY_ITEMS}
                            mode="checkbox"
                            value={showWeekends ? ['weekends'] : []}
                            onValueChange={(v) =>
                                onShowWeekendsChange(
                                    Array.isArray(v) && v.includes('weekends'),
                                )
                            }
                            fixedLabel="Exibição"
                            menuTitle="Configurações da agenda"
                            menuAlign="right"
                            menuWidth={240}
                            icon={<Settings />}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-3 pb-6 pl-2">
                <div className="ds-fc-agenda">
                    <FullCalendar
                        key={calendarKey}
                        ref={calendarRef}
                        plugins={PLUGINS}
                        views={VIEWS}
                        locale={ptBrLocale}
                        initialView={view}
                        initialDate={calendarInitialDate}
                        headerToolbar={false}
                        height={view === 'dayGridMonth' ? 'auto' : '100%'}
                        hiddenDays={
                            showWeekends ? NO_HIDDEN_DAYS : WEEKENDS_HIDDEN
                        }
                        firstDay={1}
                        allDaySlot={false}
                        slotDuration="00:30:00"
                        slotLabelInterval="00:30:00"
                        slotLabelFormat={TIME_FORMAT}
                        eventTimeFormat={TIME_FORMAT}
                        slotMinTime="06:00:00"
                        slotMaxTime="22:00:00"
                        scrollTime={scrollTime}
                        businessHours={BUSINESS_HOURS}
                        nowIndicator
                        eventDisplay="block"
                        editable
                        selectable
                        selectMirror
                        dayMaxEvents={view === 'dayGridMonth' ? 4 : true}
                        expandRows={false}
                        events={events}
                        datesSet={handleDatesSet}
                        dayHeaderContent={renderDayHeader}
                        eventContent={renderEvent}
                        noEventsText="Nenhuma consulta neste período"
                        moreLinkText={(n) => `+${n} mais`}
                        eventClick={(info) =>
                            onEventClick(
                                info.event.extendedProps
                                    .appointment as Appointment,
                            )
                        }
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
            </div>
        </section>
    );
}

function renderDayHeader(arg: DayHeaderContentArg) {
    if (arg.view.type === 'dayGridMonth') {
        return (
            <span className="text-ds-caption font-medium text-ds-content-subtle">
                {capitalize(arg.text.replace('.', ''))}
            </span>
        );
    }
    if (arg.view.type.startsWith('list')) {
        return (
            <span className="text-ds-body-xs font-semibold text-ds-content-primary">
                {capitalize(
                    arg.date.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                    }),
                )}
            </span>
        );
    }
    const weekday = capitalize(
        arg.date
            .toLocaleDateString('pt-BR', { weekday: 'short' })
            .replace('.', ''),
    );
    return (
        <div
            className={dsCn(
                'mx-auto flex h-[54px] w-[60px] flex-col items-center justify-center rounded-ds-md',
                arg.isToday && 'bg-ds-primary-80 ds-dark:bg-ds-primary-70',
            )}
        >
            <span
                className={dsCn(
                    'text-ds-caption font-medium',
                    arg.isToday
                        ? 'text-ds-content-on-brand'
                        : 'text-ds-content-subtle',
                )}
            >
                {weekday}
            </span>
            <span
                className={dsCn(
                    'mt-0.5 text-ds-body-lg leading-5 font-semibold',
                    arg.isToday
                        ? 'text-ds-content-on-brand'
                        : 'text-ds-content-primary',
                )}
            >
                {arg.date.getDate()}
            </span>
        </div>
    );
}

function renderEvent(arg: EventContentArg) {
    const apt = arg.event.extendedProps.appointment as Appointment | undefined;
    if (!apt) return undefined;
    const name = apt.patientName || apt.title || 'Consulta';
    const kind = apt.title && apt.title !== name ? apt.title : 'Consulta';
    const cancelled = apt.status === 'cancelled';

    if (arg.view.type.startsWith('list')) {
        return (
            <span>
                <b>{name}</b>
                <span className="ml-2 text-ds-content-muted">
                    {kind} · {apt.clinicUserName} · {statusLabel(apt.status)}
                </span>
            </span>
        );
    }

    if (arg.view.type === 'dayGridMonth') {
        return (
            <div
                className="flex min-w-0 items-center gap-1 text-[11px] leading-4"
                style={{ color: arg.textColor }}
            >
                <span className="shrink-0 tabular-nums opacity-90">
                    {formatTime(apt.startsAt)}
                </span>
                <span
                    className={dsCn(
                        'truncate font-semibold',
                        cancelled && 'line-through',
                    )}
                >
                    {name}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ color: arg.textColor }}>
            <span
                className={dsCn(
                    'truncate text-[12px] leading-[18px] font-semibold',
                    cancelled && 'line-through',
                )}
            >
                {name}
            </span>
            <span className="truncate text-[11px] leading-[15px] opacity-90">
                {kind}
            </span>
            <span className="text-[10px] leading-[15px] tabular-nums opacity-90">
                {formatTime(apt.startsAt)} - {formatTime(apt.endsAt)}
            </span>
            <span className="truncate text-[10px] leading-[15px] opacity-80">
                {apt.clinicUserName}
            </span>
        </div>
    );
}
