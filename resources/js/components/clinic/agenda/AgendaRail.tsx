import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import { DsButton, DsCheckbox, DsInput, dsCn } from '@/components/ds';
import type { Appointment, AppointmentStatus } from '@/domain/clinic';

import {
    DS_STATUS,
    STATUS_ORDER,
    addDays,
    isSameDay,
    monthTitle,
    startOfWeek,
    statusLabel,
    type AgendaClinicUser,
} from './agenda-shared';
import { AgendaGoogleCalendarActions } from './AgendaGoogleCalendarActions';

const MINI_WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

function normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface VisibleRange {
    start: Date;
    end: Date;
}

/**
 * Estado da coluna (busca, agendas visíveis, período e data em foco) e a
 * lista de consultas que sobra depois dos filtros dela.
 */
export function useAgendaRail(appointments: Appointment[], initialDate?: Date) {
    const [search, setSearch] = useState('');
    const [hiddenUsers, setHiddenUsers] = useState<Set<string>>(new Set());
    const [focusDate, setFocusDate] = useState(() => initialDate ?? new Date());
    const [range, setRange] = useState<VisibleRange | null>(null);

    const visible = useMemo(() => {
        const q = normalize(search.trim());
        return appointments.filter(
            (a) =>
                !hiddenUsers.has(a.clinicUserId) &&
                (!q ||
                    normalize(
                        `${a.patientName} ${a.title ?? ''} ${a.clinicUserName}`,
                    ).includes(q)),
        );
    }, [appointments, hiddenUsers, search]);

    const counts = useMemo(() => {
        const result = Object.fromEntries(
            STATUS_ORDER.map((s) => [s, 0]),
        ) as Record<AppointmentStatus, number>;
        if (!range) return result;
        for (const apt of visible) {
            const start = new Date(apt.startsAt);
            if (start >= range.start && start < range.end) {
                result[apt.status] += 1;
            }
        }
        return result;
    }, [visible, range]);

    /** Chamar no `datesSet` do FullCalendar. */
    const syncDates = useCallback((start: Date, end: Date, date: Date) => {
        setRange((r) =>
            r &&
            r.start.getTime() === start.getTime() &&
            r.end.getTime() === end.getTime()
                ? r
                : { start, end },
        );
        setFocusDate((f) => (f.getTime() === date.getTime() ? f : date));
    }, []);

    const toggleUser = (id: string) =>
        setHiddenUsers((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

    return {
        search,
        setSearch,
        hiddenUsers,
        toggleUser,
        focusDate,
        counts,
        visible,
        syncDates,
    };
}

export type AgendaRailState = ReturnType<typeof useAgendaRail>;

interface AgendaRailProps {
    rail: AgendaRailState;
    clinicUsers: AgendaClinicUser[];
    /** Fisioterapeuta só vê a própria agenda: sem "Visualizar agendas". */
    showUserFilter: boolean;
    onSelectDate: (date: Date) => void;
    className?: string;
}

/** Coluna da agenda: busca, minicalendário, resumo, agendas e Google. */
export function AgendaRail({
    rail,
    clinicUsers,
    showUserFilter,
    onSelectDate,
    className,
}: AgendaRailProps) {
    const total = STATUS_ORDER.reduce((sum, s) => sum + rail.counts[s], 0);

    return (
        <aside
            className={dsCn(
                'flex w-[300px] shrink-0 flex-col gap-6 overflow-y-auto bg-ds-surface-default px-5 pt-5 pb-10 font-ds text-ds-content-primary',
                className,
            )}
        >
            <DsInput
                type="search"
                value={rail.search}
                onValueChange={rail.setSearch}
                placeholder="Pesquisar consultas"
                iconLeft={<Search />}
            />

            <MiniCalendar selected={rail.focusDate} onSelect={onSelectDate} />

            <section>
                <div className="flex items-baseline gap-2">
                    <span className="text-ds-body-sm font-semibold">
                        {total}
                    </span>
                    <span className="text-ds-body-sm text-ds-content-secondary">
                        {total === 1 ? 'Consulta' : 'Consultas'} no período
                    </span>
                </div>
                <ul className="mt-3 space-y-1.5">
                    {STATUS_ORDER.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-ds-full"
                                style={{ background: DS_STATUS[s].accent }}
                            />
                            <span className="w-6 text-ds-body-sm font-semibold">
                                {rail.counts[s]}
                            </span>
                            <span className="truncate text-ds-body-xs text-ds-content-secondary">
                                {statusLabel(s)}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            {showUserFilter && clinicUsers.length > 0 && (
                <>
                    <hr className="border-ds-border-subtle" />
                    <section className="space-y-3">
                        <h3 className="text-ds-body-sm font-semibold">
                            Visualizar agendas
                        </h3>
                        {clinicUsers.map((user) => (
                            <DsCheckbox
                                key={user.id}
                                label={user.name}
                                checked={!rail.hiddenUsers.has(user.id)}
                                onCheckedChange={() => rail.toggleUser(user.id)}
                            />
                        ))}
                    </section>
                </>
            )}

            <hr className="border-ds-border-subtle" />

            <AgendaGoogleCalendarActions />
        </aside>
    );
}

export function MiniCalendar({
    selected,
    onSelect,
}: {
    selected: Date;
    onSelect: (date: Date) => void;
}) {
    const [month, setMonth] = useState(
        () => new Date(selected.getFullYear(), selected.getMonth(), 1),
    );
    const [synced, setSynced] = useState(selected);
    // Acompanha a navegação do calendário grande (ajuste durante o render).
    if (synced !== selected) {
        setSynced(selected);
        setMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    }
    const [today] = useState(() => new Date());

    const gridStart = startOfWeek(month);
    const lastDay = new Date(
        month.getFullYear(),
        month.getMonth() + 1,
        0,
    ).getDate();
    const lead = (month.getDay() + 6) % 7;
    const weeks = Math.ceil((lead + lastDay) / 7);
    const shift = (n: number) =>
        setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

    return (
        <div>
            <div className="flex items-center justify-between">
                <span className="text-ds-body-sm font-semibold">
                    {monthTitle(month)}
                </span>
                <div className="flex gap-1">
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<ArrowLeft />}
                        label="Mês anterior"
                        onClick={() => shift(-1)}
                    />
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<ArrowRight />}
                        label="Próximo mês"
                        onClick={() => shift(1)}
                    />
                </div>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
                {MINI_WEEKDAYS.map((d, i) => (
                    <span
                        key={i}
                        className="py-1 text-ds-caption font-medium text-ds-content-subtle"
                    >
                        {d}
                    </span>
                ))}
                {Array.from({ length: weeks * 7 }, (_, i) => {
                    const day = addDays(gridStart, i);
                    const inMonth = day.getMonth() === month.getMonth();
                    if (!inMonth) return <span key={i} />;
                    const isSel = isSameDay(day, selected);
                    const isToday = isSameDay(day, today);
                    return (
                        <button
                            key={i}
                            type="button"
                            aria-pressed={isSel}
                            aria-label={day.toLocaleDateString('pt-BR')}
                            onClick={() => onSelect(day)}
                            className={dsCn(
                                'mx-auto flex size-8 cursor-pointer items-center justify-center rounded-ds-full text-ds-caption font-medium transition-colors',
                                isSel
                                    ? 'bg-ds-primary-80 text-ds-content-on-brand ds-dark:bg-ds-primary-70'
                                    : isToday
                                      ? 'text-ds-content-brand ring-1 ring-ds-primary-80'
                                      : 'text-ds-content-secondary hover:bg-ds-surface-subtle',
                            )}
                        >
                            {day.getDate()}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
