import type FullCalendar from '@fullcalendar/react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import {
    DsBadge,
    DsButton,
    DsEmptyState,
    DsSelect,
    DsTabs,
    dsCn,
} from '@/components/ds';
import type { AppointmentStatus } from '@/domain/clinic';

import { DsCalendar, type DsCalendarView } from './DsCalendar';
import { DsGoogleCalendarActions } from './DsGoogleCalendarActions';
import {
    DS_STATUS,
    StatusLegend,
    appointmentsOn,
    formatTime,
    statusLabel,
    toDsCalendarEvent,
    type AgendaPrototypeProps,
} from './shared';

const VIEW_TABS: { key: DsCalendarView; label: string }[] = [
    { key: 'dayGridMonth', label: 'Mês' },
    { key: 'timeGridWeek', label: 'Semana' },
    { key: 'timeGridDay', label: 'Dia' },
    { key: 'listWeek', label: 'Lista' },
];

/**
 * B — o calendário ocupa a largura toda. Controles (navegação, visão,
 * profissional, status) numa barra DS acima; à direita, o trilho "Hoje" com
 * números do dia e a fila de consultas.
 */
export function VariantB({
    appointments,
    clinicUsers,
    selectedUserId,
    onUserChange,
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
    const [title, setTitle] = useState('');
    const [view, setView] = useState<DsCalendarView>('timeGridWeek');
    const [hidden, setHidden] = useState<Set<AppointmentStatus>>(new Set());
    const [now] = useState(() => new Date());

    const visible = useMemo(
        () => appointments.filter((a) => !hidden.has(a.status)),
        [appointments, hidden],
    );
    const events = useMemo(() => visible.map(toDsCalendarEvent), [visible]);
    const today = useMemo(() => appointmentsOn(visible, now), [visible, now]);
    const nextId = today.find(
        (a) =>
            new Date(a.endsAt) > now &&
            (a.status === 'scheduled' || a.status === 'confirmed'),
    )?.id;

    const api = () => calendarRef.current?.getApi();

    const toggleStatus = (status: AppointmentStatus) =>
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return next;
        });

    const count = (status: AppointmentStatus) =>
        today.filter((a) => a.status === status).length;

    const professionalOptions = [
        { value: 'all', label: 'Todos os fisioterapeutas' },
        ...clinicUsers.map((u) => ({ value: u.id, label: u.name })),
    ];

    const todayLabel = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="space-y-4 px-6 pt-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-ds-caption font-semibold tracking-wider text-ds-content-brand uppercase">
                            Agenda
                        </p>
                        <h1 className="text-ds-h3 font-semibold first-letter:uppercase">
                            {title || '…'}
                        </h1>
                        {filteredPatientName && (
                            <p className="text-ds-body-xs text-ds-content-muted">
                                Agendamentos de {filteredPatientName}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <DsGoogleCalendarActions compact />
                        <DsButton
                            icon={<Plus />}
                            label="Nova consulta"
                            onClick={onNewConsulta}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-2 shadow-ds-sm">
                    <div className="flex items-center gap-1">
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<ChevronLeft />}
                            label="Anterior"
                            onClick={() => api()?.prev()}
                        />
                        <DsButton
                            variant="secondary"
                            size="sm"
                            label="Hoje"
                            onClick={() => api()?.today()}
                        />
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="only"
                            icon={<ChevronRight />}
                            label="Próximo"
                            onClick={() => api()?.next()}
                        />
                    </div>
                    <DsTabs
                        size="sm"
                        tabs={VIEW_TABS}
                        value={view}
                        onValueChange={(key) => {
                            setView(key as DsCalendarView);
                            api()?.changeView(key);
                        }}
                    />
                    <div className="ml-auto w-64">
                        <DsSelect
                            size="sm"
                            aria-label="Fisioterapeuta"
                            options={professionalOptions}
                            value={selectedUserId ?? 'all'}
                            onValueChange={(value) =>
                                onUserChange(
                                    typeof value === 'string' && value !== 'all'
                                        ? value
                                        : undefined,
                                )
                            }
                        />
                    </div>
                </div>

                <StatusLegend hidden={hidden} onToggle={toggleStatus} />
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6 pb-24 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-sm">
                    <DsCalendar
                        key={calendarKey}
                        calendarRef={calendarRef}
                        showToolbar={false}
                        initialView="timeGridWeek"
                        events={events}
                        initialDate={calendarInitialDate}
                        onDatesSet={(t, v) => {
                            setTitle(t);
                            setView(v);
                        }}
                        onEventClick={onEventClick}
                        onDateClick={onDateClick}
                        onEventDrop={onEventDrop}
                        onEventResize={onEventResize}
                    />
                </div>

                <aside className="w-full shrink-0 space-y-4 xl:sticky xl:top-0 xl:w-80">
                    <div className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-sm">
                        <div className="flex items-center gap-2 text-ds-content-muted">
                            <CalendarDays className="size-4" />
                            <p className="text-ds-body-xs capitalize">
                                {todayLabel}
                            </p>
                        </div>
                        <p className="mt-1 text-ds-h2 font-semibold">
                            {today.length}{' '}
                            <span className="text-ds-body-sm font-normal text-ds-content-muted">
                                {today.length === 1 ? 'consulta' : 'consultas'}
                            </span>
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                            {(
                                [
                                    'scheduled',
                                    'confirmed',
                                    'completed',
                                ] as AppointmentStatus[]
                            ).map((status) => (
                                <div
                                    key={status}
                                    className={dsCn(
                                        'rounded-ds-md px-2 py-2',
                                        DS_STATUS[status].surfaceClass,
                                    )}
                                >
                                    <p
                                        className={dsCn(
                                            'text-ds-body-lg font-semibold',
                                            DS_STATUS[status].contentClass,
                                        )}
                                    >
                                        {count(status)}
                                    </p>
                                    <p className="truncate text-ds-micro text-ds-content-secondary">
                                        {statusLabel(status)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default shadow-ds-sm">
                        <h2 className="border-b border-ds-border-subtle px-4 py-3 text-ds-body-sm font-semibold">
                            Fila de hoje
                        </h2>
                        {today.length === 0 ? (
                            <DsEmptyState
                                variant="empty"
                                title="Dia livre"
                                description="Nenhuma consulta hoje com os filtros atuais."
                            />
                        ) : (
                            <ul className="max-h-[480px] divide-y divide-ds-border-subtle overflow-y-auto">
                                {today.map((apt) => {
                                    const past = new Date(apt.endsAt) < now;
                                    return (
                                        <li key={apt.id}>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEventClick(apt)
                                                }
                                                className={dsCn(
                                                    'flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-ds-surface-subtle',
                                                    apt.id === nextId &&
                                                        'bg-ds-surface-brand-subtle hover:bg-ds-surface-brand-subtle',
                                                    past && 'opacity-60',
                                                )}
                                            >
                                                <span className="w-12 shrink-0 pt-0.5 text-ds-body-xs text-ds-content-secondary tabular-nums">
                                                    {formatTime(apt.startsAt)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-ds-body-xs font-semibold">
                                                        {apt.patientName ||
                                                            apt.title}
                                                    </span>
                                                    <span className="block truncate text-ds-caption text-ds-content-muted">
                                                        {apt.clinicUserName}
                                                    </span>
                                                    {apt.id === nextId && (
                                                        <span className="mt-1 block text-ds-caption font-semibold text-ds-content-brand">
                                                            Próxima
                                                        </span>
                                                    )}
                                                </span>
                                                <DsBadge
                                                    variant={
                                                        DS_STATUS[apt.status]
                                                            .badge
                                                    }
                                                >
                                                    {statusLabel(apt.status)}
                                                </DsBadge>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
