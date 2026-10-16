import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ChevronDown, Clock } from 'lucide-react';
import type { KeyboardEvent, Ref } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { dsCn } from '../utils/ds-cn';
import { mergeRefs } from '../utils/refs';

import { formatTypedTime, HOURS, MINUTES, parseTime } from './time-format';

export interface DsTimepickerProps {
    /** Horário "HH:MM" (pode estar incompleto enquanto digita). Sem ele, o componente guarda o texto sozinho. */
    value?: string;
    /** A cada mudança do texto (digitação formatada ou escolha na lista). */
    onValueChange?: (value: string) => void;
    /** Ao confirmar: sair do campo com o texto alterado, ou escolher o minuto na lista. */
    onChange?: (value: string) => void;
    id?: string;
    disabled?: boolean;
    ariaLabel?: string;
    placeholder?: string;
    /** Texto curto à esquerda (ex.: "Das"), no lugar do ícone de relógio. */
    prefix?: string;
    className?: string;
    ref?: Ref<HTMLInputElement>;
}

type Column = 'hour' | 'minute';

/** Rola a lista para deixar o item marcado no meio,  */
function centerSelected(list: HTMLElement | null) {
    const selected = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!selected || !list) return;
    list.scrollTop =
        selected.offsetTop - list.clientHeight / 2 + selected.offsetHeight / 2;
}

/**
 * Campo de horário com máscara HH:MM e lista de horas e minutos. A lista fica
 * num Popover do Radix (portal, clique fora, Esc); o foco continua no campo ao
 * abrir com o mouse, para seguir digitando, e entra na lista pela seta para baixo.
 */
export function DsTimepicker({
    value,
    onValueChange,
    onChange,
    id,
    disabled = false,
    ariaLabel = 'Horário',
    placeholder = 'HH:MM',
    prefix,
    className,
    ref,
}: DsTimepickerProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const panelId = `${uid}-panel`;
    const inputRef = useRef<HTMLInputElement>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const hourListRef = useRef<HTMLUListElement | null>(null);
    const minuteListRef = useRef<HTMLUListElement | null>(null);
    // Ao abrir pelo teclado, o foco entra na coluna das horas quando ela monta.
    const focusHoursOnOpen = useRef(false);

    // Sem `value` do pai, o componente guarda o texto sozinho.
    const [uncontrolled, setUncontrolled] = useState('');
    const current = value ?? uncontrolled;

    const [openState, setOpenState] = useState(false);
    // Desabilitado com a lista aberta: zera o estado, para ela não reabrir
    // sozinha quando o campo voltar a ficar habilitado.
    if (disabled && openState) setOpenState(false);
    const open = openState && !disabled;
    const [selectedHour, setSelectedHour] = useState('00');
    const [selectedMinute, setSelectedMinute] = useState('00');
    const [activeHour, setActiveHour] = useState(0);
    const [activeMinute, setActiveMinute] = useState(0);

    // que o onChange do React não expõe; por isso o listener direto no input.
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);
    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        const commit = () =>
            onChangeRef.current?.(formatTypedTime(input.value));
        input.addEventListener('change', commit);
        return () => input.removeEventListener('change', commit);
    }, []);

    function emit(next: string) {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    }

    function select(hour: string, minute: string) {
        setSelectedHour(hour);
        setSelectedMinute(minute);
        setActiveHour(HOURS.indexOf(hour));
        setActiveMinute(MINUTES.indexOf(minute));
    }

    function showPanel(focusHours = false) {
        if (disabled) return;
        if (!open) {
            const [hour = '00', minute = '00'] = current.split(':');
            select(
                HOURS.includes(hour) ? hour : '00',
                MINUTES.includes(minute) ? minute : '00',
            );
            focusHoursOnOpen.current = focusHours;
            setOpenState(true);
        } else if (focusHours) {
            hourListRef.current?.focus();
        }
    }

    function closeAndFocusInput() {
        setOpenState(false);
        inputRef.current?.focus();
    }

    function updateValue(text: string) {
        const next = formatTypedTime(text);
        const parsed = parseTime(next);
        if (parsed) select(parsed.hour, parsed.minute);
        emit(next);
    }

    function chooseHour(hour: string) {
        setSelectedHour(hour);
        setActiveHour(HOURS.indexOf(hour));
        centerSelectedLater(hourListRef);
    }

    function chooseMinute(minute: string) {
        const next = `${selectedHour}:${minute}`;
        setSelectedMinute(minute);
        emit(next);
        closeAndFocusInput();
        onChange?.(next);
    }

    function centerSelectedLater(list: { current: HTMLElement | null }) {
        requestAnimationFrame(() => centerSelected(list.current));
    }

    // Callback refs estáveis: o Portal do Radix só monta a lista um render
    // depois, e é aí que ela precisa rolar até o item marcado.
    const setHourList = useCallback((element: HTMLUListElement | null) => {
        hourListRef.current = element;
        if (!element) return;
        centerSelected(element);
        if (focusHoursOnOpen.current) {
            focusHoursOnOpen.current = false;
            element.focus();
        }
    }, []);
    const setMinuteList = useCallback((element: HTMLUListElement | null) => {
        minuteListRef.current = element;
        centerSelected(element);
    }, []);

    function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            showPanel(true);
        }
    }

    function handleListKeyDown(
        column: Column,
        event: KeyboardEvent<HTMLUListElement>,
    ) {
        const items = column === 'hour' ? HOURS : MINUTES;
        const active = column === 'hour' ? activeHour : activeMinute;
        const setActive = column === 'hour' ? setActiveHour : setActiveMinute;
        const last = items.length - 1;

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setActive(Math.min(active + 1, last));
                break;
            case 'ArrowUp':
                event.preventDefault();
                setActive(Math.max(active - 1, 0));
                break;
            case 'Home':
                event.preventDefault();
                setActive(0);
                break;
            case 'End':
                event.preventDefault();
                setActive(last);
                break;
            case 'ArrowRight':
            case 'ArrowLeft':
                event.preventDefault();
                (column === 'hour'
                    ? minuteListRef
                    : hourListRef
                ).current?.focus();
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (column === 'hour') {
                    chooseHour(items[active]);
                    minuteListRef.current?.focus();
                } else {
                    chooseMinute(items[active]);
                }
                break;
            case 'Tab':
                // A lista vive num portal no fim do <body>: o Tab sairia para
                // lugar nenhum. Fecha e devolve o foco ao campo.
                event.preventDefault();
                closeAndFocusInput();
                break;
        }
    }

    // Mantém visível o item ativo das setas.
    const scrollActiveIntoView = (element: HTMLLIElement | null) => {
        element?.scrollIntoView?.({ block: 'nearest' });
    };

    const optionId = (column: Column, item: string) =>
        `${uid}-${column}-${item}`;

    function renderColumn(column: Column) {
        const isHour = column === 'hour';
        const items = isHour ? HOURS : MINUTES;
        const selected = isHour ? selectedHour : selectedMinute;
        const active = isHour ? activeHour : activeMinute;
        const headId = `${uid}-${column}-head`;

        return (
            <div className="min-w-0">
                <span
                    id={headId}
                    className="block px-1 pt-0.5 pb-1.5 text-center text-ds-micro font-semibold text-ds-content-subtle uppercase"
                >
                    {isHour ? 'Hora' : 'Minuto'}
                </span>
                <ul
                    ref={isHour ? setHourList : setMinuteList}
                    role="listbox"
                    tabIndex={-1}
                    aria-labelledby={headId}
                    aria-activedescendant={optionId(column, items[active])}
                    onKeyDown={(event) => handleListKeyDown(column, event)}
                    className="m-0 h-[190px] list-none overflow-y-auto rounded-ds-xs p-0 pr-[3px] outline-none [scrollbar-color:var(--ds-content-subtle)_transparent] [scrollbar-width:thin] focus-visible:shadow-ds-focus"
                >
                    {items.map((item, index) => {
                        const isSelected = item === selected;
                        const isActive = index === active;
                        return (
                            <li
                                key={item}
                                ref={
                                    isActive ? scrollActiveIntoView : undefined
                                }
                                id={optionId(column, item)}
                                role="option"
                                aria-selected={isSelected}
                                data-active={isActive || undefined}
                                onClick={() =>
                                    isHour
                                        ? chooseHour(item)
                                        : chooseMinute(item)
                                }
                                onMouseMove={() =>
                                    (isHour ? setActiveHour : setActiveMinute)(
                                        index,
                                    )
                                }
                                className={dsCn(
                                    'm-0 flex h-8 w-full cursor-pointer items-center justify-center rounded-ds-xs p-0 font-ds text-ds-body-xs text-ds-content-secondary',
                                    'hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand',
                                    'data-[active]:bg-ds-surface-brand-subtle data-[active]:text-ds-content-brand',
                                    isSelected &&
                                        'bg-ds-primary-80 text-ds-content-on-brand hover:bg-ds-primary-80 hover:text-ds-content-on-brand data-[active]:bg-ds-primary-80 data-[active]:text-ds-content-on-brand',
                                )}
                            >
                                {item}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }

    return (
        <div
            ref={rootRef}
            data-state={open ? 'open' : 'closed'}
            data-disabled={disabled || undefined}
            className={dsCn(
                prefix ? 'w-[180px]' : 'w-40',
                'font-ds',
                className,
            )}
        >
            <PopoverPrimitive.Root
                open={open}
                onOpenChange={(next) => {
                    if (!next) setOpenState(false);
                }}
            >
                <PopoverPrimitive.Anchor asChild>
                    <div
                        className={dsCn(
                            'flex h-10 items-center gap-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-3',
                            'transition-[border-color,box-shadow] duration-[120ms]',
                            'has-[input:focus]:border-ds-primary-80 has-[input:focus]:shadow-ds-focus',
                            open && 'border-ds-primary-80 shadow-ds-focus',
                            prefix && 'gap-0 pl-0',
                            disabled &&
                                'cursor-not-allowed bg-ds-surface-disabled',
                        )}
                    >
                        {prefix ? (
                            <span className="inline-flex shrink-0 items-center self-stretch border-r border-ds-border-subtle px-3 font-ds text-ds-caption font-medium text-ds-content-muted">
                                {prefix}
                            </span>
                        ) : (
                            <Clock
                                data-testid="ds-timepicker-icon"
                                aria-hidden="true"
                                className="size-4 shrink-0 text-ds-content-subtle"
                            />
                        )}
                        <input
                            ref={mergeRefs(inputRef, ref)}
                            id={uid}
                            value={current}
                            aria-label={ariaLabel}
                            type="text"
                            role="combobox"
                            inputMode="numeric"
                            maxLength={5}
                            autoComplete="off"
                            placeholder={placeholder}
                            disabled={disabled}
                            aria-expanded={open}
                            aria-haspopup="listbox"
                            aria-controls={open ? panelId : undefined}
                            onChange={(event) =>
                                updateValue(event.target.value)
                            }
                            onClick={() => showPanel()}
                            onKeyDown={handleInputKeyDown}
                            className={dsCn(
                                'min-w-0 flex-1 border-0 bg-transparent font-ds text-ds-caption text-ds-content-secondary outline-0',
                                'placeholder:text-ds-content-subtle disabled:cursor-not-allowed disabled:text-ds-content-subtle',
                                prefix && 'pl-2.5',
                            )}
                        />
                        <button
                            type="button"
                            aria-label="Escolher horário na lista"
                            tabIndex={-1}
                            disabled={disabled}
                            // Não rouba o foco do campo: segue digitando com a lista aberta.
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => {
                                if (open) {
                                    setOpenState(false);
                                    return;
                                }
                                inputRef.current?.focus();
                                showPanel();
                            }}
                            className="inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-ds-content-subtle disabled:cursor-not-allowed"
                        >
                            <ChevronDown
                                aria-hidden="true"
                                className={dsCn(
                                    'size-4 transition-transform duration-[120ms]',
                                    open && 'rotate-180',
                                )}
                            />
                        </button>
                    </div>
                </PopoverPrimitive.Anchor>

                <PopoverPrimitive.Portal>
                    <PopoverPrimitive.Content
                        id={panelId}
                        side="bottom"
                        align="end"
                        sideOffset={4}
                        collisionPadding={8}
                        // O foco fica onde está (no campo) ou vai para as horas
                        // pelo setHourList; nada de foco automático do Radix.
                        onOpenAutoFocus={(event) => event.preventDefault()}
                        onCloseAutoFocus={(event) => event.preventDefault()}
                        onEscapeKeyDown={() => inputRef.current?.focus()}
                        // Clicar no próprio campo (ou na seta) não conta como fora;
                        // o foco indo para outro lugar (Tab) fecha a lista.
                        onInteractOutside={(event) => {
                            if (
                                rootRef.current?.contains(
                                    event.target as Node | null,
                                )
                            ) {
                                event.preventDefault();
                            }
                        }}
                        className="z-[11010] grid grid-cols-[repeat(2,52px)] gap-1 rounded-ds-md border border-ds-border-subtle bg-ds-surface-raised p-2 font-ds shadow-ds-md ds-dark:[color-scheme:dark]"
                    >
                        {renderColumn('hour')}
                        {renderColumn('minute')}
                    </PopoverPrimitive.Content>
                </PopoverPrimitive.Portal>
            </PopoverPrimitive.Root>
        </div>
    );
}
