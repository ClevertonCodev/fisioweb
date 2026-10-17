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
import { ArrowLeft, ArrowRight, CalendarPlus, Settings } from 'lucide-react';
import { useCallback, useState, type ReactNode, type Ref } from 'react';

import { DsButton, DsDropdown, dsCn } from '@/components/ds';
import type { Appointment } from '@/domain/clinic';
import { isTerminalAppointmentStatus } from '@/domain/clinic';

import {
    DEMO_PREFIX,
    capitalize,
    monthTitle,
    type useAgendaRail,
} from './AgendaRail';
import { DS_STATUS, formatTime, statusLabel } from './shared';

export type ViewId =
    | 'listWeek'
    | 'timeGridDay'
    | 'timeGridThreeDay'
    | 'timeGridWeek'
    | 'dayGridMonth';

const VIEW_ITEMS: { key: ViewId; label: string }[] = [
    { key: 'listWeek', label: 'Atendimentos' },
    { key: 'timeGridDay', label: 'Dia' },
    { key: 'timeGridThreeDay', label: '3 dias' },
    { key: 'timeGridWeek', label: 'Semana' },
    { key: 'dayGridMonth', label: 'Mês' },
];

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
 * Consulta no formato da A: fundo suave + faixa de status (classe
 * `ds-ev-soft` no CSS) e texto na cor do status.
 */
export function toWideEvent(apt: Appointment): EventInput {
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
        editable:
            !isTerminalAppointmentStatus(apt.status) &&
            !apt.id.startsWith(DEMO_PREFIX),
        extendedProps: { appointment: apt },
    };
}

interface WideAgendaSectionProps {
    calendarRef: Ref<FullCalendar>;
    rail: ReturnType<typeof useAgendaRail>;
    events: EventInput[];
    filteredPatientName?: string;
    /** Quando presente, "Nova consulta" fica à direita da linha do título. */
    onNewConsulta?: () => void;
    /** Conteúdo antes do "Hoje" (ex.: botão que abre a coluna). */
    toolbarStart?: ReactNode;
    calendarKey: string;
    calendarInitialDate?: Date;
    onNavigate: (action: 'today' | 'prev' | 'next') => void;
    onChangeView: (view: ViewId) => void;
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => Promise<void>;
    onEventResize: (id: string, start: string, end: string) => Promise<void>;
}

/**
 * PROTOTYPE — título, barra (Hoje ← → mês, visão, exibição) e o FullCalendar
 * em altura total.
 */
export function WideAgendaSection({
    calendarRef,
    rail,
    events,
    filteredPatientName,
    onNewConsulta,
    toolbarStart,
    calendarKey,
    calendarInitialDate,
    onNavigate,
    onChangeView,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
}: WideAgendaSectionProps) {
    const [view, setView] = useState<ViewId>('timeGridWeek');
    const [showWeekends, setShowWeekends] = useState(true);
    const [scrollTime] = useState(() => {
        const hour = Math.min(Math.max(new Date().getHours() - 1, 6), 18);
        return `${String(hour).padStart(2, '0')}:00:00`;
    });

    const { syncDates } = rail;
    const onDatesSet = useCallback(
        (arg: DatesSetArg) =>
            syncDates(arg.start, arg.end, arg.view.calendar.getDate()),
        [syncDates],
    );

    const changeView = (next: ViewId) => {
        setView(next);
        onChangeView(next);
    };

    return (
        <section className="flex min-w-0 flex-1 flex-col bg-ds-surface-default">
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 px-6 pt-5 pb-4">
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
                    <div className="flex items-center gap-2">
                        {toolbarStart}
                        <DsButton
                            variant="secondary"
                            label="Hoje"
                            onClick={() => onNavigate('today')}
                        />
                        <DsButton
                            variant="tertiary"
                            iconPosition="only"
                            icon={<ArrowLeft />}
                            label="Anterior"
                            onClick={() => onNavigate('prev')}
                        />
                        <DsButton
                            variant="tertiary"
                            iconPosition="only"
                            icon={<ArrowRight />}
                            label="Próximo"
                            onClick={() => onNavigate('next')}
                        />
                        <span className="ml-1 text-ds-body-lg font-medium">
                            {monthTitle(rail.focusDate)}
                        </span>
                    </div>
                </div>

                {/* Nova consulta com a mesma largura de Semana + Exibição. */}
                <div className="flex flex-col items-stretch gap-3">
                    {onNewConsulta && (
                        <DsButton
                            iconPosition="left"
                            size="lg"
                            icon={<CalendarPlus />}
                            label="Nova consulta"
                            onClick={onNewConsulta}
                            className="w-full"
                        />
                    )}
                    <div className="flex items-center gap-2">
                        <DsDropdown
                            items={VIEW_ITEMS}
                            value={view}
                            onValueChange={(v) => changeView(v as ViewId)}
                            menuAlign="right"
                        />
                        <DsDropdown
                            items={[
                                {
                                    key: 'weekends',
                                    label: 'Mostrar fins de semana',
                                },
                                {
                                    key: 'demo',
                                    label: 'Simular todos os status',
                                },
                            ]}
                            mode="checkbox"
                            value={[
                                ...(showWeekends ? ['weekends'] : []),
                                ...(rail.showDemo ? ['demo'] : []),
                            ]}
                            onValueChange={(v) => {
                                const keys = Array.isArray(v) ? v : [];
                                setShowWeekends(keys.includes('weekends'));
                                rail.setShowDemo(keys.includes('demo'));
                            }}
                            fixedLabel="Exibição"
                            menuTitle="Configurações da agenda"
                            menuAlign="right"
                            menuWidth={240}
                            icon={<Settings />}
                        />
                    </div>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-3 pb-20 pl-2">
                <div className="ds-fc-wide">
                    <FullCalendar
                        key={calendarKey}
                        ref={calendarRef}
                        plugins={PLUGINS}
                        views={VIEWS}
                        locale={ptBrLocale}
                        initialView="timeGridWeek"
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
                        datesSet={onDatesSet}
                        dayHeaderContent={renderDayHeader}
                        eventContent={renderEvent}
                        noEventsText="Nenhuma consulta neste período"
                        moreLinkText={(n) => `+${n} mais`}
                        eventClick={(info) => {
                            const apt = info.event.extendedProps
                                .appointment as Appointment;
                            // Simulação não existe no servidor: não abre modal.
                            if (!apt.id.startsWith(DEMO_PREFIX)) {
                                onEventClick(apt);
                            }
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
