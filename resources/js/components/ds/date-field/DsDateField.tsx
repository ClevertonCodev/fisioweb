import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    DayPicker,
    useDayPicker,
    type DayButtonProps,
    type MonthCaptionProps,
} from 'react-day-picker';

import { fieldIconButtonClass } from '../field/field';
import { DsInput } from '../input/DsInput';
import { DsSelect } from '../select/DsSelect';
import { dsCn } from '../utils/ds-cn';

/**
 * Campo de data digitável (DD/MM/AAAA) com calendário no ícone. O cabeçalho
 * tem mês e ano em select — diferente do `DsDatepicker`, que é um botão e
 * anda mês a mês.
 */

const MONTHS = [
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

function maskDate(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8);
    if (d.length <= 2) return d;
    if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function toIso(d: Date): string {
    return format(d, 'yyyy-MM-dd');
}

function isoToDate(iso: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
}

function brToIso(br: string, min: Date, max: Date): string {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
    if (!m) return '';
    const date = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    const sameParts =
        date.getFullYear() === Number(m[3]) &&
        date.getMonth() === Number(m[2]) - 1 &&
        date.getDate() === Number(m[1]);
    return sameParts && date >= min && date <= max ? toIso(date) : '';
}

function isoToBr(iso: string): string {
    const d = isoToDate(iso);
    return d ? format(d, 'dd/MM/yyyy') : '';
}

const navClass =
    'flex size-7 cursor-pointer items-center justify-center rounded-ds-md border-none bg-transparent text-ds-content-muted enabled:hover:bg-ds-surface-subtle enabled:hover:text-ds-content-primary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:shadow-ds-focus focus-visible:outline-none';

/** Cabeçalho: setas e selects de mês e ano (DsSelect pequeno). */
function makeCaption(min: Date, max: Date) {
    const years = Array.from(
        { length: max.getFullYear() - min.getFullYear() + 1 },
        (_, i) => max.getFullYear() - i,
    );
    return function Caption({
        calendarMonth,
        displayIndex,
        children,
        ...props
    }: MonthCaptionProps) {
        const { previousMonth, nextMonth, goToMonth } = useDayPicker();
        const current = calendarMonth.date;
        void displayIndex;
        void children;
        return (
            <div {...props}>
                <button
                    type="button"
                    aria-label="Mês anterior"
                    disabled={!previousMonth}
                    onClick={() => previousMonth && goToMonth(previousMonth)}
                    className={navClass}
                >
                    <ChevronLeft className="size-3.5" />
                </button>
                <div className="flex gap-2">
                    <div className="w-32">
                        <DsSelect
                            size="sm"
                            aria-label="Mês"
                            options={MONTHS.map((label, i) => ({
                                value: String(i),
                                label,
                            }))}
                            value={String(current.getMonth())}
                            onValueChange={(v) =>
                                goToMonth(
                                    new Date(
                                        current.getFullYear(),
                                        Number(v),
                                        1,
                                    ),
                                )
                            }
                        />
                    </div>
                    <div className="w-24">
                        <DsSelect
                            size="sm"
                            aria-label="Ano"
                            options={years.map((y) => ({
                                value: String(y),
                                label: String(y),
                            }))}
                            value={String(current.getFullYear())}
                            onValueChange={(v) =>
                                goToMonth(
                                    new Date(Number(v), current.getMonth(), 1),
                                )
                            }
                        />
                    </div>
                </div>
                <button
                    type="button"
                    aria-label="Próximo mês"
                    disabled={!nextMonth}
                    onClick={() => nextMonth && goToMonth(nextMonth)}
                    className={navClass}
                >
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        );
    };
}

/** Mesmo visual do dia do DsDatepicker. */
function DayButton({ day, modifiers, className, ...props }: DayButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);
    return (
        <button
            ref={ref}
            {...props}
            className={dsCn(
                className,
                'flex size-9 cursor-pointer items-center justify-center rounded-ds-md border-none bg-transparent p-0 font-ds text-ds-body-compact text-ds-content-primary transition-[background,color] duration-100 outline-none hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus',
                day.outside && 'text-ds-border-subtle',
                modifiers.disabled &&
                    'cursor-not-allowed text-ds-gray-40 hover:bg-transparent ds-dark:text-ds-gray-70',
                modifiers.today &&
                    'font-bold text-ds-primary-100 ds-dark:text-ds-primary-60',
                modifiers.selected &&
                    'bg-ds-primary-80 text-ds-white hover:bg-ds-primary-80 ds-dark:text-ds-white',
            )}
        />
    );
}

export function DsDateField({
    label,
    value,
    onChange,
    onBlur,
    error,
    helper,
    min = new Date(1900, 0, 1),
    max = new Date(),
    name,
    required,
}: {
    label: string;
    required?: boolean;
    /** AAAA-MM-DD, ou '' enquanto incompleta ou inválida. */
    value: string;
    onChange: (iso: string) => void;
    onBlur?: () => void;
    error?: string;
    /** Ajuda quando não há erro (ex.: a idade). */
    helper?: string;
    min?: Date;
    max?: Date;
    name?: string;
}) {
    const [text, setText] = useState(isoToBr(value));
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        // Trocado por fora (calendário, reset): mostra o novo valor.
        if (value !== brToIso(text, min, max)) setText(isoToBr(value));
    }
    const [open, setOpen] = useState(false);
    const selected = isoToDate(value);
    const [month, setMonth] = useState<Date>(selected ?? max);
    const [Caption] = useState(() => makeCaption(min, max));

    const openCalendar = (next: boolean) => {
        if (next) setMonth(selected ?? max);
        setOpen(next);
    };

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={openCalendar}>
            <PopoverPrimitive.Anchor asChild>
                <div>
                    <DsInput
                        label={label}
                        required={required}
                        name={name}
                        placeholder="DD/MM/AAAA"
                        inputMode="numeric"
                        value={text}
                        onValueChange={(v) => {
                            const masked = maskDate(v);
                            setText(masked);
                            onChange(brToIso(masked, min, max));
                        }}
                        onBlur={onBlur}
                        state={error ? 'error' : 'default'}
                        helper={
                            error
                                ? text.length === 10
                                    ? 'Data inválida'
                                    : error
                                : (helper ?? 'Digite ou escolha no calendário')
                        }
                        iconRight={
                            <PopoverPrimitive.Trigger asChild>
                                <button
                                    type="button"
                                    aria-label="Abrir calendário"
                                    className={fieldIconButtonClass}
                                >
                                    <Calendar />
                                </button>
                            </PopoverPrimitive.Trigger>
                        }
                    />
                </div>
            </PopoverPrimitive.Anchor>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    align="end"
                    sideOffset={4}
                    collisionPadding={8}
                    aria-label="Selecionar data"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                    className="z-[11010] rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default font-ds shadow-ds-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 ds-dark:[color-scheme:dark]"
                >
                    <DayPicker
                        mode="single"
                        locale={ptBR}
                        month={month}
                        onMonthChange={setMonth}
                        startMonth={min}
                        endMonth={max}
                        disabled={[{ before: min }, { after: max }]}
                        selected={selected ?? undefined}
                        onSelect={(_s, day) => {
                            onChange(toIso(day));
                            setText(format(day, 'dd/MM/yyyy'));
                            setOpen(false);
                        }}
                        showOutsideDays
                        fixedWeeks
                        autoFocus
                        hideNavigation
                        className="p-4"
                        components={{ MonthCaption: Caption, DayButton }}
                        formatters={{
                            formatWeekdayName: (d: Date) =>
                                WEEKDAYS[d.getDay()] ?? '',
                        }}
                        classNames={{
                            root: 'font-ds',
                            month: 'min-w-[252px]',
                            month_caption:
                                'mb-3 flex items-center justify-between gap-2',
                            month_grid: 'block border-collapse',
                            weekdays: 'mb-1 grid grid-cols-[repeat(7,36px)]',
                            weekday:
                                'flex h-7 w-9 items-center justify-center p-0 text-[0.6875rem] font-semibold text-ds-content-subtle',
                            weeks: 'flex flex-col gap-0.5',
                            week: 'grid grid-cols-[repeat(7,36px)]',
                            day: 'size-9 p-0',
                        }}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
