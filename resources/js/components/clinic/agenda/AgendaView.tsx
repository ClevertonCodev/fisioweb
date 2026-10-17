import type FullCalendar from '@fullcalendar/react';
import { ChevronRight, Pin, PinOff } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import { DsButton, DsDrawer, dsCn } from '@/components/ds';
import type { AgendaView as AgendaViewId, Appointment } from '@/domain/clinic';

import type { AgendaClinicUser } from './agenda-shared';
import { AgendaCalendar, toAgendaEvent } from './AgendaCalendar';
import { useGoogleCalendarReturnToast } from './AgendaGoogleCalendarActions';
import { AgendaRail, useAgendaRail } from './AgendaRail';

import './agenda.css';

export interface AgendaViewProps {
    /** Consultas já filtradas por paciente (`?patientId=`). */
    appointments: Appointment[];
    clinicUsers: AgendaClinicUser[];
    showUserFilter: boolean;
    view: AgendaViewId;
    onViewChange: (view: AgendaViewId) => void;
    showWeekends: boolean;
    onShowWeekendsChange: (show: boolean) => void;
    filteredPatientName?: string;
    calendarKey: string;
    calendarInitialDate?: Date;
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => Promise<void>;
    onEventResize: (id: string, start: string, end: string) => Promise<void>;
    onNewConsulta: () => void;
}

/**
 * Agenda v2: coluna da esquerda flutuante (abre ao passar o mouse na borda,
 * com alfinete para fixar; em gaveta abaixo de `lg`) e calendário em altura
 * total.
 */
export function AgendaView({
    appointments,
    clinicUsers,
    showUserFilter,
    view,
    onViewChange,
    showWeekends,
    onShowWeekendsChange,
    filteredPatientName,
    calendarKey,
    calendarInitialDate,
    onEventClick,
    onDateClick,
    onEventDrop,
    onEventResize,
    onNewConsulta,
}: AgendaViewProps) {
    useGoogleCalendarReturnToast();
    const calendarRef = useRef<FullCalendar>(null);
    const rail = useAgendaRail(appointments, calendarInitialDate);
    const events = useMemo(
        () => rail.visible.map(toAgendaEvent),
        [rail.visible],
    );

    const [hoverOpen, setHoverOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const closeTimer = useRef<number | undefined>(undefined);
    const floatRef = useRef<HTMLDivElement>(null);

    // Fixar/soltar muda a largura do calendário sem resize da janela.
    useEffect(() => {
        const id = window.setTimeout(
            () => calendarRef.current?.getApi().updateSize(),
            220,
        );
        return () => window.clearTimeout(id);
    }, [pinned]);

    useEffect(() => () => window.clearTimeout(closeTimer.current), []);

    const goToDate = useCallback(
        (date: Date) => calendarRef.current?.getApi().gotoDate(date),
        [],
    );
    const goToDateFromDrawer = useCallback((date: Date) => {
        calendarRef.current?.getApi().gotoDate(date);
        setDrawerOpen(false);
    }, []);

    const railProps = { rail, clinicUsers, showUserFilter };

    const openHover = () => {
        window.clearTimeout(closeTimer.current);
        setHoverOpen(true);
    };
    const scheduleHoverClose = () => {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = window.setTimeout(() => {
            // Não fecha com o foco dentro (ex.: digitando na busca).
            if (!floatRef.current?.contains(document.activeElement)) {
                setHoverOpen(false);
            }
        }, 250);
    };

    const cornerButton = (
        label: string,
        icon: ReactNode,
        onClick: () => void,
    ) => (
        <div className="absolute top-3 right-3">
            <DsButton
                variant="tertiary"
                size="sm"
                iconPosition="only"
                icon={icon}
                label={label}
                onClick={onClick}
            />
        </div>
    );

    const left = pinned ? (
        <div className="relative hidden lg:flex">
            <AgendaRail
                {...railProps}
                onSelectDate={goToDate}
                className="border-r border-ds-border-subtle pt-14"
            />
            {cornerButton('Soltar coluna (volta a flutuar)', <PinOff />, () =>
                setPinned(false),
            )}
        </div>
    ) : (
        <div className="relative z-30 hidden w-4 shrink-0 lg:block">
            {/* Borda sensível ao mouse + alça "FILTROS" visível */}
            <div
                className="absolute inset-y-0 left-0 w-4 border-r border-ds-border-subtle bg-ds-surface-subtle"
                onMouseEnter={openHover}
                onMouseLeave={scheduleHoverClose}
            />
            <button
                type="button"
                onMouseEnter={openHover}
                onMouseLeave={scheduleHoverClose}
                onClick={openHover}
                onFocus={openHover}
                aria-label="Abrir filtros e resumo"
                aria-expanded={hoverOpen}
                className="absolute top-40 left-0 flex cursor-pointer flex-col items-center gap-2 rounded-r-ds-md bg-ds-primary-80 px-1 py-3 text-ds-content-on-brand shadow-ds-sm ds-dark:bg-ds-primary-70"
            >
                <ChevronRight className="size-4" />
                <span className="text-ds-micro font-semibold tracking-wider [writing-mode:vertical-rl]">
                    FILTROS
                </span>
            </button>

            <div
                ref={floatRef}
                onMouseEnter={openHover}
                onMouseLeave={scheduleHoverClose}
                onBlur={scheduleHoverClose}
                inert={!hoverOpen}
                className={dsCn(
                    'absolute inset-y-0 left-0 flex overflow-hidden rounded-r-ds-xl shadow-[4px_0_24px_rgba(26,26,47,0.16)] transition-transform duration-200 ease-out',
                    hoverOpen
                        ? 'translate-x-0'
                        : 'pointer-events-none -translate-x-[110%]',
                )}
            >
                <AgendaRail
                    {...railProps}
                    onSelectDate={goToDate}
                    className="pt-14"
                />
                {cornerButton('Fixar coluna', <Pin />, () => {
                    setPinned(true);
                    setHoverOpen(false);
                })}
            </div>
        </div>
    );

    return (
        <div className="flex h-full min-h-0 flex-col bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="flex min-h-0 flex-1">
                {left}

                <AgendaCalendar
                    calendarRef={calendarRef}
                    events={events}
                    focusDate={rail.focusDate}
                    view={view}
                    onViewChange={onViewChange}
                    showWeekends={showWeekends}
                    onShowWeekendsChange={onShowWeekendsChange}
                    filteredPatientName={filteredPatientName}
                    onNewConsulta={onNewConsulta}
                    onOpenFilters={() => setDrawerOpen(true)}
                    calendarKey={calendarKey}
                    calendarInitialDate={calendarInitialDate}
                    onDatesSet={rail.syncDates}
                    onEventClick={onEventClick}
                    onDateClick={onDateClick}
                    onEventDrop={onEventDrop}
                    onEventResize={onEventResize}
                />
            </div>

            <DsDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                placement="left"
                size="sm"
                title="Filtros"
            >
                <AgendaRail
                    {...railProps}
                    onSelectDate={goToDateFromDrawer}
                    className="w-full px-0 pt-0"
                />
            </DsDrawer>
        </div>
    );
}
