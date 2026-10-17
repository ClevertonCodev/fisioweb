import type FullCalendar from '@fullcalendar/react';
import { ChevronRight, Pin, PinOff } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DsButton, dsCn } from '@/components/ds';
import type { AppointmentStatus } from '@/domain/clinic';

import { AgendaRail, useAgendaRail } from './AgendaRail';
import { DS_STATUS, STATUS_ORDER, type AgendaPrototypeProps } from './shared';
import { WideAgendaSection, toWideEvent } from './WideAgenda';

/** Amostra de cada status igual à consulta do calendário. */
const SOFT_SWATCH = Object.fromEntries(
    STATUS_ORDER.map((s) => [
        s,
        { surface: DS_STATUS[s].surface, accent: DS_STATUS[s].accent },
    ]),
) as Record<AppointmentStatus, { surface: string; accent: string }>;

/**
 * A — agenda no DS com a coluna da esquerda flutuante: fica escondida atrás
 * de uma alça "FILTROS" na borda, abre por cima do calendário ao passar o
 * mouse e fecha ao sair (não fecha com o foco dentro). O alfinete fixa a
 * coluna aberta; aí o calendário encolhe para dar lugar a ela.
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
    const events = useMemo(() => rail.visible.map(toWideEvent), [rail.visible]);
    const api = () => calendarRef.current?.getApi();

    const [hoverOpen, setHoverOpen] = useState(false);
    const [pinned, setPinned] = useState(false);
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

    const railPanel = (className?: string) => (
        <AgendaRail
            rail={rail}
            clinicUsers={clinicUsers}
            statusSwatch={SOFT_SWATCH}
            onSelectDate={(d) => api()?.gotoDate(d)}
            className={className}
        />
    );

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
            {railPanel('border-r border-ds-border-subtle pt-14')}
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
                aria-label="Abrir filtros e resumo"
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
                className={dsCn(
                    'absolute inset-y-0 left-0 flex overflow-hidden rounded-r-ds-xl shadow-[4px_0_24px_rgba(26,26,47,0.16)] transition-transform duration-200 ease-out',
                    hoverOpen
                        ? 'translate-x-0'
                        : 'pointer-events-none -translate-x-[110%]',
                )}
            >
                {railPanel('flex pt-14')}
                {cornerButton('Fixar coluna', <Pin />, () => {
                    setPinned(true);
                    setHoverOpen(false);
                })}
            </div>
        </div>
    );

    return (
        <div className="flex min-h-0 flex-1">
            {left}

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
