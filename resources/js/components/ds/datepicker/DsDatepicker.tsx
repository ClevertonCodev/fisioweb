import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
    DayButtonProps,
    DayPickerProps,
    MonthCaptionProps,
} from 'react-day-picker';
import { DayPicker, useDayPicker } from 'react-day-picker';

import { dsCn } from '../utils/ds-cn';

import type {
    DatepickerPreset,
    DatepickerProps,
    DatepickerValue,
    DateRange,
} from './types';

const MONTHS = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
];
const MONTHS_FULL = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Data inválida (ex.: `new Date('')`) vale como vazia. */
function validDate(d: Date | null | undefined): Date | null {
    return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** O mesmo valor, com toda data inválida trocada por null. */
function normalizeValue(value: DatepickerValue): DatepickerValue {
    if (value instanceof Date) return validDate(value);
    if (!value) return null;
    return { start: validDate(value.start), end: validDate(value.end) };
}

function dateOnly(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date | null | undefined, b: Date | null | undefined) {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
}

function firstOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function fmtDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fmtNumericDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function relativeDayLabel(start: Date, end: Date): string | null {
    if (!isSameDay(start, end)) return null;
    const today = new Date();
    const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 1,
    );
    if (isSameDay(start, today)) return `Hoje, ${fmtNumericDate(start)}`;
    if (isSameDay(start, yesterday)) return `Ontem, ${fmtNumericDate(start)}`;
    return null;
}

function monthTitle(d: Date): string {
    return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

function isRange(value: DatepickerValue | undefined): value is DateRange {
    return !!value && !(value instanceof Date);
}

function sameValue(
    a: DatepickerValue | undefined,
    b: DatepickerValue | undefined,
): boolean {
    const time = (d: Date | null | undefined) => d?.getTime() ?? null;
    // Só um dos dois é Date (o pai trocou de data para intervalo): diferentes.
    if (a instanceof Date || b instanceof Date) {
        return a instanceof Date && b instanceof Date && time(a) === time(b);
    }
    if (isRange(a) && isRange(b)) {
        return time(a.start) === time(b.start) && time(a.end) === time(b.end);
    }
    return !a && !b;
}

function defaultPresets(): DatepickerPreset[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAgo = (n: number) => {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
    };
    return [
        {
            key: 'today',
            label: 'Hoje',
            range: () => ({ start: today, end: today }),
        },
        {
            key: 'yesterday',
            label: 'Ontem',
            range: () => ({ start: daysAgo(1), end: daysAgo(1) }),
        },
        {
            key: 'last7',
            label: 'Últimos 7 dias',
            range: () => ({ start: daysAgo(6), end: today }),
        },
        {
            key: 'thisMonth',
            label: 'Este mês',
            range: () => ({
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today,
            }),
        },
        {
            key: 'allTime',
            label: 'Intervalo de Datas',
            range: () => ({ start: new Date(2020, 0, 1), end: today }),
        },
    ];
}

interface Draft {
    single: Date | null;
    start: Date | null;
    end: Date | null;
    /** Range: esperando o segundo clique. */
    selecting: boolean;
}

const EMPTY_DRAFT: Draft = {
    single: null,
    start: null,
    end: null,
    selecting: false,
};

/** Reinicia o rascunho a partir do valor confirmado. */
function draftFrom(
    value: DatepickerValue | undefined,
    mode: DatepickerProps['mode'],
): Draft {
    if (mode === 'single' && value instanceof Date) {
        return { ...EMPTY_DRAFT, single: value };
    }
    if (mode === 'range' && isRange(value)) {
        return { ...EMPTY_DRAFT, start: value.start, end: value.end };
    }
    return EMPTY_DRAFT;
}

function monthFrom(
    value: DatepickerValue | undefined,
    mode: DatepickerProps['mode'],
) {
    if (mode === 'single' && value instanceof Date) return firstOfMonth(value);
    if (mode === 'range' && isRange(value) && value.start) {
        return firstOfMonth(value.start);
    }
    return null;
}

const navClass =
    'flex size-7 cursor-pointer items-center justify-center rounded-ds-md border-none bg-transparent font-ds text-ds-content-muted enabled:hover:bg-ds-surface-subtle enabled:hover:text-ds-content-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:shadow-ds-focus focus-visible:outline-none';

/** Cabeçalho do mês: seta anterior no primeiro, próxima no último. */
function MonthCaption({
    calendarMonth,
    displayIndex,
    children,
    ...props
}: MonthCaptionProps) {
    const { previousMonth, nextMonth, goToMonth, months } = useDayPicker();
    const isFirst = displayIndex === 0;
    const isLast = displayIndex === months.length - 1;
    void calendarMonth;

    return (
        <div {...props}>
            {isFirst ? (
                <button
                    type="button"
                    aria-label="Mês anterior"
                    disabled={!previousMonth}
                    onClick={() => previousMonth && goToMonth(previousMonth)}
                    className={navClass}
                >
                    <ChevronLeft aria-hidden="true" className="size-3.5" />
                </button>
            ) : (
                <span className="size-7" />
            )}
            {children}
            {isLast ? (
                <button
                    type="button"
                    aria-label="Próximo mês"
                    disabled={!nextMonth}
                    onClick={() => nextMonth && goToMonth(nextMonth)}
                    className={navClass}
                >
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                </button>
            ) : (
                <span className="size-7" />
            )}
        </div>
    );
}

/** Botão do dia com o visual do .ds-cal__day e os estados em data-*. */
function DayButton({ day, modifiers, className, ...props }: DayButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    // O DayButton padrão do react-day-picker move o foco assim (setas do teclado).
    useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const outside = day.outside;
    const disabled = modifiers.disabled;
    const today = modifiers.today;
    const selected = modifiers.dsSelected;
    const start = modifiers.dsStart;
    const end = modifiers.dsEnd;
    const inRange = modifiers.dsInRange;
    const solid = selected || start || end;

    return (
        <button
            ref={ref}
            {...props}
            data-outside={outside || undefined}
            data-disabled={disabled || undefined}
            data-today={today || undefined}
            data-selected={selected || undefined}
            data-range-start={start || undefined}
            data-range-end={end || undefined}
            data-in-range={inRange || undefined}
            className={dsCn(
                className,
                'flex size-9 cursor-pointer items-center justify-center rounded-ds-md border-none bg-transparent p-0 font-ds text-ds-body-compact text-ds-content-primary transition-[background,color] duration-100 outline-none hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus',
                outside && 'text-ds-border-subtle',
                disabled &&
                    'cursor-not-allowed text-ds-gray-40 hover:bg-transparent ds-dark:text-ds-gray-70',
                today &&
                    'font-bold text-ds-primary-100 ds-dark:text-ds-primary-60',
                inRange &&
                    'rounded-none bg-ds-primary-80/10 text-ds-primary-100 ds-dark:text-ds-primary-60',
                solid &&
                    'bg-ds-primary-80 text-ds-white hover:bg-ds-primary-80 ds-dark:text-ds-white',
                start && !end && 'rounded-l-ds-md rounded-r-none',
                end && !start && 'rounded-l-none rounded-r-ds-md',
            )}
        />
    );
}

const calendarClassNames: DayPickerProps['classNames'] = {
    root: 'font-ds',
    months: 'flex',
    month: 'min-w-[252px] [&+&]:border-l [&+&]:border-ds-border-subtle [&+&]:pl-5',
    month_caption: 'mb-3 flex items-center justify-between',
    caption_label: 'text-ds-body-xs font-semibold text-ds-content-primary',
    month_grid: 'block border-collapse',
    weekdays: 'mb-1 grid grid-cols-[repeat(7,36px)]',
    weekday:
        'flex h-7 w-9 items-center justify-center p-0 text-[0.6875rem] font-semibold text-ds-content-subtle',
    weeks: 'flex flex-col gap-0.5',
    week: 'grid grid-cols-[repeat(7,36px)]',
    day: 'size-9 p-0',
};

const footerButton =
    'cursor-pointer rounded-ds-md border border-transparent px-[18px] py-[7px] font-ds text-ds-body-xs font-medium transition-[background] duration-150 outline-none focus-visible:shadow-ds-focus';

/**
 * Seletor de data (single) ou período (range, com atalhos e Aplicar/Cancelar).
 * O calendário é o react-day-picker em pt-BR; o Popover do Radix cuida do
 * portal, do clique fora, do Esc e de devolver o foco ao gatilho.
 */
export function DsDatepicker({
    value,
    onValueChange,
    mode = 'range',
    placeholder = 'Selecionar período',
    minDate,
    maxDate,
    disabled = false,
    presets = [],
    trigger,
    id,
    className,
    ref,
}: DatepickerProps) {
    const presetsTitleId = useId();
    const [uncontrolled, setUncontrolled] = useState<DatepickerValue>(null);
    // Data inválida vira null: com NaN o sameValue nunca daria igual (loop).
    const committed =
        value !== undefined ? normalizeValue(value) : uncontrolled;

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<Draft>(() => draftFrom(committed, mode));
    const [month, setMonth] = useState<Date>(
        () => monthFrom(committed, mode) ?? firstOfMonth(new Date()),
    );
    const [hover, setHover] = useState<Date | null>(null);

    const [synced, setSynced] = useState(committed);
    if (!sameValue(synced, committed)) {
        setSynced(committed);
        setDraft(draftFrom(committed, mode));
        const nextMonth = monthFrom(committed, mode);
        if (nextMonth) setMonth(nextMonth);
    }

    function resetDraft() {
        setDraft(draftFrom(committed, mode));
        const nextMonth = monthFrom(committed, mode);
        if (nextMonth) setMonth(nextMonth);
        setHover(null);
    }

    function emit(next: DatepickerValue) {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    }

    // Desabilitado com o painel aberto: fecha e descarta o rascunho, para não
    // ficar um painel preso com o "Aplicar" funcionando.
    if (disabled && open) {
        setOpen(false);
        resetDraft();
    }

    // Esc, clique fora e clique no gatilho aberto: descarta o que não foi aplicado.
    // Fechar vale mesmo desabilitado; só abrir é bloqueado.
    function handleOpenChange(next: boolean) {
        if (next) {
            if (!disabled) setOpen(true);
        } else {
            resetDraft();
            setOpen(false);
        }
    }

    const validMin = validDate(minDate);
    const validMax = validDate(maxDate);
    const min = validMin ? dateOnly(validMin) : null;
    const max = validMax ? dateOnly(validMax) : null;

    function isDisabled(d: Date) {
        const dayOnly = dateOnly(d);
        return !!((min && dayOnly < min) || (max && dayOnly > max));
    }

    function selectDay(d: Date) {
        if (isDisabled(d)) return;

        if (mode === 'single') {
            setDraft({ ...EMPTY_DRAFT, single: d });
            emit(d);
            setOpen(false);
            return;
        }

        setDraft((current) => {
            if (!current.selecting || (current.start && current.end)) {
                // Primeiro clique
                return { ...current, start: d, end: null, selecting: true };
            }
            // Segundo clique (antes do início vira o novo início)
            if (current.start && d < current.start) {
                return {
                    ...current,
                    start: d,
                    end: current.start,
                    selecting: false,
                };
            }
            return { ...current, end: d, selecting: false };
        });
    }

    function clampDay(d: Date | null): Date | null {
        if (!d) return null;
        if (min && dateOnly(d) < min) return min;
        if (max && dateOnly(d) > max) return max;
        return d;
    }

    /** Intervalo do atalho cortado em [minDate, maxDate]; null se fica todo fora. */
    function presetRange(preset: DatepickerPreset): DateRange | null {
        const range = preset.range();
        const start = validDate(range.start);
        const end = validDate(range.end);
        const first = start ?? end;
        const last = end ?? start;
        if (min && last && dateOnly(last) < min) return null;
        if (max && first && dateOnly(first) > max) return null;
        return { start: clampDay(start), end: clampDay(end) };
    }

    function applyPreset(preset: DatepickerPreset) {
        const range = presetRange(preset);
        if (!range) return;
        setDraft((current) => ({
            ...current,
            start: range.start,
            end: range.end,
        }));
        // O calendário vai até o início do atalho (ex.: "Intervalo de Datas").
        if (range.start) setMonth(firstOfMonth(range.start));
    }

    function apply() {
        emit({ start: draft.start, end: draft.end });
        setOpen(false);
    }

    function cancel() {
        resetDraft();
        setOpen(false);
    }

    let label = placeholder;
    if (mode === 'single') {
        if (draft.single) label = fmtDate(draft.single);
    } else if (draft.start && draft.end) {
        label =
            relativeDayLabel(draft.start, draft.end) ??
            `${fmtDate(draft.start)} — ${fmtDate(draft.end)}`;
    } else if (draft.start) {
        label = `${fmtDate(draft.start)} — ...`;
    }

    const rangeEdge = draft.end ?? hover;
    function inRange(d: Date) {
        if (mode !== 'range' || !draft.start || !rangeEdge) return false;
        const [lo, hi] =
            draft.start <= rangeEdge
                ? [draft.start, rangeEdge]
                : [rangeEdge, draft.start];
        return d > lo && d < hi;
    }

    const disabledMatchers = [
        ...(min ? [{ before: min }] : []),
        ...(max ? [{ after: max }] : []),
    ];

    const calendarProps = {
        locale: ptBR,
        month,
        onMonthChange: setMonth,
        startMonth: min ? firstOfMonth(min) : undefined,
        endMonth: max ? firstOfMonth(max) : undefined,
        numberOfMonths: mode === 'range' ? 2 : 1,
        showOutsideDays: true,
        fixedWeeks: true,
        autoFocus: true,
        hideNavigation: true,
        disabled: disabledMatchers,
        classNames: calendarClassNames,
        components: { MonthCaption, DayButton },
        formatters: {
            formatCaption: monthTitle,
            formatWeekdayName: (d: Date) => WEEKDAYS[d.getDay()],
        },
        labels: {
            labelGrid: monthTitle,
            labelDayButton: (d: Date, modifiers: Record<string, boolean>) =>
                `${modifiers.today ? 'Hoje, ' : ''}${format(d, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}`,
        },
        modifiers: {
            dsSelected: (d: Date) =>
                mode === 'single' && isSameDay(d, draft.single),
            dsStart: (d: Date) => mode === 'range' && isSameDay(d, draft.start),
            dsEnd: (d: Date) => mode === 'range' && isSameDay(d, draft.end),
            dsInRange: inRange,
        },
        onDayMouseEnter: (d: Date, modifiers: Record<string, boolean>) => {
            if (!modifiers.disabled) setHover(d);
        },
        onDayMouseLeave: () => setHover(null),
    } satisfies Partial<DayPickerProps>;

    const calendar =
        mode === 'single' ? (
            <DayPicker
                {...calendarProps}
                mode="single"
                selected={draft.single ?? undefined}
                onSelect={(_selected, day) => selectDay(day)}
                className="p-4"
            />
        ) : (
            <DayPicker
                {...calendarProps}
                mode="range"
                selected={
                    draft.start
                        ? { from: draft.start, to: draft.end ?? undefined }
                        : undefined
                }
                onSelect={(_selected, day) => selectDay(day)}
            />
        );

    return (
        <div
            data-mode={mode}
            data-disabled={disabled || undefined}
            className={dsCn('relative inline-flex flex-col font-ds', className)}
        >
            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <PopoverPrimitive.Trigger asChild>
                    <button
                        ref={ref}
                        id={id}
                        type="button"
                        disabled={disabled}
                        className="inline-flex min-w-[220px] cursor-pointer items-center gap-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-4 py-3 font-ds text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ds-primary-80 focus-visible:shadow-ds-focus enabled:hover:border-ds-primary-80 disabled:cursor-not-allowed disabled:bg-ds-surface-subtle disabled:text-ds-content-muted ds-dark:focus-visible:border-ds-primary-60 ds-dark:enabled:hover:border-ds-primary-60"
                    >
                        {trigger ? (
                            trigger({ label, open })
                        ) : (
                            <>
                                <Calendar
                                    aria-hidden="true"
                                    className="size-[18px] shrink-0 text-ds-content-subtle"
                                />
                                <span className="flex-1 text-left">
                                    {label}
                                </span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0 text-ds-content-subtle"
                                />
                            </>
                        )}
                    </button>
                </PopoverPrimitive.Trigger>

                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        align="start"
                        sideOffset={8}
                        collisionPadding={8}
                        aria-label={
                            mode === 'range'
                                ? 'Selecionar período'
                                : 'Selecionar data'
                        }
                        // O foco vai para o dia (autoFocus do calendário), não para o 1º botão.
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        className="data-[state=open]:slide-in-from-top-1.5 z-[11010] flex rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default font-ds shadow-ds-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 ds-dark:[color-scheme:dark]"
                    >
                        {mode === 'range' ? (
                            <>
                                <aside className="flex min-w-40 flex-col gap-1 border-r border-ds-border-subtle py-4">
                                    <div
                                        id={presetsTitleId}
                                        className="mb-1 flex items-center gap-2 border-b border-ds-border-subtle px-4 pb-2.5 text-ds-body-compact font-semibold text-ds-content-primary"
                                    >
                                        <Calendar
                                            aria-hidden="true"
                                            className="size-4"
                                        />
                                        <span>Selecionar data</span>
                                    </div>
                                    <div
                                        role="group"
                                        aria-labelledby={presetsTitleId}
                                        className="flex flex-col gap-0.5 px-2"
                                    >
                                        {(presets.length
                                            ? presets
                                            : defaultPresets()
                                        ).map((preset) => (
                                            <button
                                                key={preset.key}
                                                type="button"
                                                // Atalho todo fora de [minDate, maxDate].
                                                disabled={!presetRange(preset)}
                                                onClick={() =>
                                                    applyPreset(preset)
                                                }
                                                className="cursor-pointer rounded-ds-md border-none bg-transparent px-3 py-[7px] text-left font-ds text-ds-body-compact text-ds-content-primary transition-[background] duration-100 outline-none focus-visible:shadow-ds-focus enabled:hover:bg-ds-surface-subtle disabled:cursor-not-allowed disabled:text-ds-content-subtle"
                                            >
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </aside>

                                <div className="flex flex-col">
                                    {draft.start && (
                                        <div className="flex items-center gap-3 border-b border-ds-border-subtle bg-ds-surface-subtle px-5 py-3">
                                            <span className="text-ds-caption text-ds-content-muted">
                                                Período selecionado
                                            </span>
                                            <span className="text-ds-body-compact font-medium text-ds-content-primary">
                                                {fmtDate(draft.start)}
                                                {draft.end
                                                    ? ` — ${fmtDate(draft.end)}`
                                                    : ''}
                                            </span>
                                        </div>
                                    )}

                                    <div className="px-5 py-4">{calendar}</div>

                                    <div className="flex justify-end gap-2 border-t border-ds-border-subtle px-5 pt-3 pb-4">
                                        <button
                                            type="button"
                                            onClick={cancel}
                                            className={dsCn(
                                                footerButton,
                                                'border-ds-border-subtle bg-transparent text-ds-content-primary hover:bg-ds-surface-subtle',
                                            )}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={apply}
                                            className={dsCn(
                                                footerButton,
                                                'bg-ds-primary-80 text-ds-white hover:bg-ds-primary-100',
                                            )}
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            calendar
                        )}
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </div>
    );
}
