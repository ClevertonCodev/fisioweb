import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState, type MouseEvent } from 'react';

import { DsButton, dsCn } from '@/components/ds';
import type { Appointment } from '@/domain/clinic';

import {
    DS_STATUS,
    InitialsAvatar,
    StatusLegend,
    addDays,
    appointmentsOn,
    formatTime,
    isSameDay,
    startOfDay,
    startOfWeek,
    statusLabel,
    type AgendaClinicUser,
    type AgendaPrototypeProps,
} from './shared';

const START_HOUR = 7;
const END_HOUR = 21;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 44;
const SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;
const PX_PER_MINUTE = SLOT_HEIGHT / SLOT_MINUTES;

function minutesFromStart(date: Date): number {
    return (date.getHours() - START_HOUR) * 60 + date.getMinutes();
}

/** Distribui consultas sobrepostas em faixas lado a lado. */
function layoutLanes(items: Appointment[]) {
    const placed: { apt: Appointment; lane: number; lanes: number }[] = [];
    let cluster: typeof placed = [];
    let clusterEnd = 0;
    let laneEnds: number[] = [];

    const flush = () => {
        const lanes = laneEnds.length;
        cluster.forEach((p) => (p.lanes = lanes));
        cluster = [];
        laneEnds = [];
    };

    for (const apt of items) {
        const start = new Date(apt.startsAt).getTime();
        const end = new Date(apt.endsAt).getTime();
        if (cluster.length > 0 && start >= clusterEnd) flush();
        let lane = laneEnds.findIndex((laneEnd) => laneEnd <= start);
        if (lane < 0) {
            lane = laneEnds.length;
            laneEnds.push(end);
        } else {
            laneEnds[lane] = end;
        }
        const entry = { apt, lane, lanes: 1 };
        cluster.push(entry);
        placed.push(entry);
        clusterEnd = Math.max(clusterEnd, end);
    }
    flush();
    return placed;
}

/**
 * C — sem grade semanal. Um dia por vez, uma coluna por fisioterapeuta
 * (o "quem atende quem" da recepção). A semana vira uma tira de dias com a
 * contagem de consultas. Protótipo: sem arrastar/redimensionar.
 */
export function VariantC({
    appointments,
    clinicUsers,
    selectedUserId,
    onUserChange,
    filteredPatientName,
    calendarInitialDate,
    onEventClick,
    onDateClick,
    onNewConsulta,
}: AgendaPrototypeProps) {
    const [now] = useState(() => new Date());
    const [day, setDay] = useState(() =>
        startOfDay(calendarInitialDate ?? now),
    );
    const weekStart = startOfWeek(day);
    const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    const dayAppointments = useMemo(
        () => appointmentsOn(appointments, day),
        [appointments, day],
    );

    const columns: AgendaClinicUser[] = useMemo(() => {
        const base =
            clinicUsers.length > 0
                ? clinicUsers
                : Array.from(
                      new Map(
                          appointments.map((a) => [
                              a.clinicUserId,
                              { id: a.clinicUserId, name: a.clinicUserName },
                          ]),
                      ).values(),
                  );
        return selectedUserId
            ? base.filter((u) => u.id === selectedUserId)
            : base;
    }, [appointments, clinicUsers, selectedUserId]);

    const handleSlotClick = (event: MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const minutes =
            Math.floor((event.clientY - rect.top) / SLOT_HEIGHT) * SLOT_MINUTES;
        const date = new Date(day);
        date.setHours(START_HOUR, minutes, 0, 0);
        onDateClick(date);
    };

    const nowTop = isSameDay(day, now)
        ? minutesFromStart(now) * PX_PER_MINUTE
        : null;

    const dayLabel = day.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 border-b border-ds-border-subtle bg-ds-surface-default px-6 pt-5 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-ds-page-title font-semibold first-letter:uppercase">
                            {dayLabel}
                        </h1>
                        <p className="text-ds-body-xs text-ds-content-muted">
                            {filteredPatientName
                                ? `Agendamentos de ${filteredPatientName} · `
                                : ''}
                            {dayAppointments.length}{' '}
                            {dayAppointments.length === 1
                                ? 'consulta'
                                : 'consultas'}{' '}
                            · {columns.length}{' '}
                            {columns.length === 1
                                ? 'profissional'
                                : 'profissionais'}
                        </p>
                    </div>
                    <DsButton
                        icon={<Plus />}
                        label="Nova consulta"
                        onClick={onNewConsulta}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<ChevronLeft />}
                        label="Semana anterior"
                        onClick={() => setDay(addDays(day, -7))}
                    />
                    <div className="grid flex-1 grid-cols-7 gap-1.5">
                        {week.map((d) => {
                            const selected = isSameDay(d, day);
                            const isToday = isSameDay(d, now);
                            const total = appointmentsOn(
                                appointments,
                                d,
                            ).length;
                            return (
                                <button
                                    key={d.toISOString()}
                                    type="button"
                                    onClick={() => setDay(d)}
                                    className={dsCn(
                                        'flex cursor-pointer flex-col items-center rounded-ds-md border px-1 py-2 transition-colors',
                                        selected
                                            ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-content-on-brand ds-dark:border-ds-primary-70 ds-dark:bg-ds-primary-70'
                                            : 'border-ds-border-subtle hover:bg-ds-surface-subtle',
                                    )}
                                >
                                    <span
                                        className={dsCn(
                                            'text-ds-caption capitalize',
                                            selected
                                                ? 'text-ds-content-on-brand'
                                                : 'text-ds-content-muted',
                                        )}
                                    >
                                        {d.toLocaleDateString('pt-BR', {
                                            weekday: 'short',
                                        })}
                                    </span>
                                    <span
                                        className={dsCn(
                                            'text-ds-body-lg font-semibold',
                                            !selected &&
                                                isToday &&
                                                'text-ds-content-brand',
                                        )}
                                    >
                                        {d.getDate()}
                                    </span>
                                    <span
                                        className={dsCn(
                                            'text-ds-micro',
                                            selected
                                                ? 'text-ds-content-on-brand'
                                                : total
                                                  ? 'text-ds-content-secondary'
                                                  : 'text-ds-content-subtle',
                                        )}
                                    >
                                        {total ? `${total} cons.` : '—'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<ChevronRight />}
                        label="Próxima semana"
                        onClick={() => setDay(addDays(day, 7))}
                    />
                    <DsButton
                        variant="secondary"
                        size="sm"
                        label="Hoje"
                        onClick={() => setDay(startOfDay(now))}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusLegend />
                    {selectedUserId && (
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            label="Ver todos os profissionais"
                            onClick={() => onUserChange(undefined)}
                        />
                    )}
                </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto px-6 pb-24">
                <div
                    className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default shadow-ds-sm"
                    style={{
                        minWidth: 64 + columns.length * 200,
                    }}
                >
                    {/* Cabeçalho: um profissional por coluna */}
                    <div className="sticky top-0 z-10 flex border-b border-ds-border-subtle bg-ds-surface-default">
                        <div className="w-16 shrink-0" />
                        {columns.map((user) => {
                            const total = dayAppointments.filter(
                                (a) => a.clinicUserId === user.id,
                            ).length;
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    title="Filtrar só este profissional"
                                    onClick={() =>
                                        onUserChange(
                                            selectedUserId === user.id
                                                ? undefined
                                                : user.id,
                                        )
                                    }
                                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-l border-ds-border-subtle px-3 py-3 text-left hover:bg-ds-surface-subtle"
                                >
                                    <InitialsAvatar
                                        name={user.name}
                                        src={user.photoUrl}
                                    />
                                    <span className="min-w-0">
                                        <span className="block truncate text-ds-body-xs font-semibold">
                                            {user.name}
                                        </span>
                                        <span className="block text-ds-caption text-ds-content-muted">
                                            {total}{' '}
                                            {total === 1
                                                ? 'consulta'
                                                : 'consultas'}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative flex">
                        {/* Régua de horas */}
                        <div className="w-16 shrink-0">
                            {Array.from({ length: SLOTS }, (_, i) => (
                                <div
                                    key={i}
                                    style={{ height: SLOT_HEIGHT }}
                                    className="pr-2 text-right text-ds-caption text-ds-content-muted tabular-nums"
                                >
                                    {i % 2 === 0
                                        ? `${String(START_HOUR + i / 2).padStart(2, '0')}:00`
                                        : ''}
                                </div>
                            ))}
                        </div>

                        {columns.map((user) => {
                            const placed = layoutLanes(
                                dayAppointments.filter(
                                    (a) => a.clinicUserId === user.id,
                                ),
                            );
                            return (
                                <div
                                    key={user.id}
                                    role="presentation"
                                    onClick={handleSlotClick}
                                    className="relative min-w-0 flex-1 cursor-copy border-l border-ds-border-subtle"
                                    style={{ height: SLOTS * SLOT_HEIGHT }}
                                >
                                    {Array.from({ length: SLOTS }, (_, i) => (
                                        <div
                                            key={i}
                                            style={{ height: SLOT_HEIGHT }}
                                            className={dsCn(
                                                'border-t',
                                                i % 2 === 0
                                                    ? 'border-ds-border-subtle'
                                                    : 'border-dashed border-ds-border-subtle/60',
                                            )}
                                        />
                                    ))}

                                    {placed.map(({ apt, lane, lanes }) => {
                                        const start = new Date(apt.startsAt);
                                        const end = new Date(apt.endsAt);
                                        const top = Math.max(
                                            0,
                                            minutesFromStart(start) *
                                                PX_PER_MINUTE,
                                        );
                                        const height = Math.max(
                                            22,
                                            ((end.getTime() - start.getTime()) /
                                                60000) *
                                                PX_PER_MINUTE -
                                                2,
                                        );
                                        const tone = DS_STATUS[apt.status];
                                        return (
                                            <button
                                                key={apt.id}
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEventClick(apt);
                                                }}
                                                className={dsCn(
                                                    'absolute cursor-pointer overflow-hidden rounded-ds-sm border-l-[3px] px-2 py-1 text-left transition-[filter] hover:brightness-95 ds-dark:hover:brightness-125',
                                                    tone.surfaceClass,
                                                )}
                                                style={{
                                                    top,
                                                    height,
                                                    left: `calc(${(lane / lanes) * 100}% + 4px)`,
                                                    width: `calc(${100 / lanes}% - 8px)`,
                                                    borderLeftColor:
                                                        tone.accent,
                                                }}
                                            >
                                                <span
                                                    className={dsCn(
                                                        'block truncate text-ds-caption font-semibold',
                                                        tone.contentClass,
                                                        apt.status ===
                                                            'cancelled' &&
                                                            'line-through',
                                                    )}
                                                >
                                                    {apt.patientName ||
                                                        apt.title}
                                                </span>
                                                {height > 34 && (
                                                    <span className="block truncate text-ds-micro text-ds-content-secondary tabular-nums">
                                                        {formatTime(start)}–
                                                        {formatTime(end)} ·{' '}
                                                        {statusLabel(
                                                            apt.status,
                                                        )}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {nowTop !== null &&
                            nowTop >= 0 &&
                            nowTop <= SLOTS * SLOT_HEIGHT && (
                                <div
                                    className="pointer-events-none absolute right-0 left-14 z-[1] flex items-center"
                                    style={{ top: nowTop }}
                                >
                                    <span className="size-2 rounded-ds-full bg-ds-status-danger-content" />
                                    <span className="h-0.5 flex-1 bg-ds-status-danger-content" />
                                </div>
                            )}
                    </div>
                </div>
            </div>
        </div>
    );
}
