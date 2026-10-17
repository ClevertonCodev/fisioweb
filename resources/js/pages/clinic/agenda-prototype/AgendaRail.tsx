import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { DsButton, DsCheckbox, DsInput, dsCn } from '@/components/ds';
import type { Appointment, AppointmentStatus } from '@/domain/clinic';

import { DsGoogleCalendarActions } from './DsGoogleCalendarActions';
import {
    STATUS_ORDER,
    addDays,
    isSameDay,
    startOfWeek,
    statusLabel,
    type AgendaClinicUser,
} from './shared';

const MINI_WEEKDAYS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function monthTitle(date: Date): string {
    return capitalize(
        date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    );
}

function normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Prefixo das consultas de simulação (não abrem modal nem arrastam). */
export const DEMO_PREFIX = 'demo-';

const DEMO_KINDS: Record<AppointmentStatus, string> = {
    scheduled: 'Avaliação',
    confirmed: 'Sessão',
    no_show: 'Retorno',
    completed: 'Reavaliação',
    cancelled: 'Sessão de Pilates',
};

/** Uma consulta por status, de seg a sex da semana atual, às 07:00. */
function demoAppointments(): Appointment[] {
    const monday = startOfWeek(new Date());
    return STATUS_ORDER.map((status, i) => {
        const start = addDays(monday, i);
        start.setHours(7, 0, 0, 0);
        const end = new Date(start);
        end.setHours(8);
        return {
            id: `${DEMO_PREFIX}${status}`,
            patientId: `${DEMO_PREFIX}patient`,
            patientName: `Simulação · ${statusLabel(status)}`,
            clinicUserId: `${DEMO_PREFIX}user`,
            clinicUserName: 'Profissional de exemplo',
            title: DEMO_KINDS[status],
            description: null,
            startsAt: start.toISOString(),
            endsAt: end.toISOString(),
            status,
            location: null,
            source: 'system',
        };
    });
}

export interface VisibleRange {
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
    const [showDemo, setShowDemo] = useState(true);
    const [demo] = useState(demoAppointments);

    const visible = useMemo(() => {
        const q = normalize(search.trim());
        const all = showDemo ? [...appointments, ...demo] : appointments;
        return all.filter(
            (a) =>
                !hiddenUsers.has(a.clinicUserId) &&
                (!q ||
                    normalize(
                        `${a.patientName} ${a.title ?? ''} ${a.clinicUserName}`,
                    ).includes(q)),
        );
    }, [appointments, demo, hiddenUsers, search, showDemo]);

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
        showDemo,
        setShowDemo,
        visible,
        syncDates,
    };
}

interface AgendaRailProps {
    rail: ReturnType<typeof useAgendaRail>;
    clinicUsers: AgendaClinicUser[];
    /**
     * Aparência de cada status igual à consulta no calendário: `surface` é o
     * fundo e `accent` a faixa (no sólido, os dois são a mesma cor).
     */
    statusSwatch: Record<
        AppointmentStatus,
        { surface: string; accent: string }
    >;
    onSelectDate: (date: Date) => void;
    /** Conteúdo acima da busca (ex.: botão "Nova consulta"). */
    top?: ReactNode;
    className?: string;
}

/** PROTOTYPE — a coluna da variante D: busca, minicalendário, resumo e agendas. */
export function AgendaRail({
    rail,
    clinicUsers,
    statusSwatch,
    onSelectDate,
    top,
    className,
}: AgendaRailProps) {
    const total = STATUS_ORDER.reduce((sum, s) => sum + rail.counts[s], 0);

    return (
        <aside
            className={dsCn(
                'hidden w-[300px] shrink-0 flex-col gap-6 overflow-y-auto bg-ds-surface-default px-5 pt-5 pb-24 lg:flex',
                className,
            )}
        >
            {top}

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
                    <span className="text-ds-h4 font-semibold">{total}</span>
                    <span className="text-ds-body-sm text-ds-content-secondary">
                        {total === 1 ? 'Consulta' : 'Consultas'} no período
                    </span>
                </div>
                <div className="mt-3 flex h-2 w-full gap-0.5 overflow-hidden rounded-ds-full bg-ds-surface-subtle">
                    {total > 0 &&
                        STATUS_ORDER.filter((s) => rail.counts[s] > 0).map(
                            (s) => (
                                <div
                                    key={s}
                                    title={`${statusLabel(s)}: ${rail.counts[s]}`}
                                    className="h-full rounded-ds-full transition-[width]"
                                    style={{
                                        width: `${(rail.counts[s] / total) * 100}%`,
                                        background: statusSwatch[s].accent,
                                    }}
                                />
                            ),
                        )}
                </div>
                <ul className="mt-3 space-y-1.5">
                    {STATUS_ORDER.map((s) => (
                        <li key={s} className="flex items-center gap-2">
                            <span
                                className="size-2.5 shrink-0 rounded-ds-full"
                                style={{ background: statusSwatch[s].accent }}
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

            <hr className="border-ds-border-subtle" />

            <DsGoogleCalendarActions />
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
