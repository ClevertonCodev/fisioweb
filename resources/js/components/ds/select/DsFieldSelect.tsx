import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import {
    describedBy,
    DsFieldControl,
    DsFieldHelper,
    DsFieldLabel,
    DsFieldStateIcon,
    fieldHelperId,
    fieldShellVariants,
} from '../field/field';
import { countryFlagEmoji } from '../utils/country-flag';
import { dsCn } from '../utils/ds-cn';
import { mergeRefs } from '../utils/refs';

import type { FieldSelectProps, SelectOption } from './types';

interface CoreProps extends FieldSelectProps {
    /** Mostra a bandeira de `flagCode` (DsFieldSelectOptions). */
    showFlags?: boolean;
    /**
     * Gatilho compacto (só bandeira e seta, sem rótulo nem moldura), usado no
     * seletor de país do DsPhoneField. O texto vira o nome acessível do gatilho.
     */
    compactTriggerLabel?: string;
}

function toSelected(value: FieldSelectProps['value'], options: SelectOption[]) {
    if (value === undefined || value === null) return [];
    if (Array.isArray(value)) return value.filter((v) => v !== '');
    if (value === '' && !options.some((o) => String(o.value) === '')) return [];
    return [value];
}

function Flag({ code }: { code?: string }) {
    const emoji = code ? countryFlagEmoji(code) : '';
    if (!emoji) return null;
    return (
        <span
            data-testid="ds-flag"
            aria-hidden="true"
            className="shrink-0 text-[15px] leading-none"
        >
            {emoji}
        </span>
    );
}

/**
 * Select com lista própria (single, multi e busca). Sobre o Popover do Radix,
 * que cuida do portal, do clique fora, do Esc e de devolver o foco ao gatilho.
 */
export function FieldSelectCore({
    value,
    onValueChange,
    options,
    mode = 'single',
    label,
    helper,
    placeholder = 'Selecione...',
    searchPlaceholder = 'Buscar...',
    searchable = false,
    filterLocally = true,
    minSearchLength = 0,
    emptyMessage = '',
    state = 'default',
    size = 'md',
    disabled = false,
    hideApplyButton = false,
    footerLinkLabel,
    multiDisplay = 'labels',
    hideSelectedInMenu = false,
    iconLeft,
    id,
    name,
    className,
    onBlur,
    onOpen,
    onClose,
    onApply,
    onFooterLinkClick,
    onSearch,
    showFlags = false,
    compactTriggerLabel,
    ref,
}: CoreProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const helperId = fieldHelperId(uid);
    const labelId = `${uid}-label`;
    const valueId = `${uid}-value`;
    const listboxId = `${uid}-listbox`;
    const listboxRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const anchorRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const mergedTriggerRef = useMemo(() => mergeRefs(ref, triggerRef), [ref]);
    // O foco está no conjunto gatilho + popover? Evita onBlur repetido.
    const focusedRef = useRef(false);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(-1);
    // Sem `value` do pai, o componente guarda a escolha sozinho.
    const [uncontrolled, setUncontrolled] = useState<string | string[]>(
        mode === 'multi' || mode === 'multi-search' ? [] : '',
    );

    const isMulti = mode === 'multi' || mode === 'multi-search';
    const isSearch = mode === 'search' || mode === 'multi-search';
    const showSearch = isSearch || searchable;
    const selected = toSelected(value ?? uncontrolled, options);
    const hasValue = selected.length > 0;

    const searchTooShort =
        showSearch &&
        minSearchLength > 0 &&
        query.trim().length < minSearchLength;

    const filtered = useMemo(() => {
        if (searchTooShort) return [];
        let list = options;
        if (isMulti && hideSelectedInMenu && selected.length > 0) {
            const chosen = new Set(selected);
            list = list.filter((o) => !chosen.has(String(o.value)));
        }
        if (!filterLocally || !showSearch || !query) return list;
        const q = query.toLowerCase();
        return list.filter((o) => o.label.toLowerCase().includes(q));
    }, [
        options,
        searchTooShort,
        isMulti,
        hideSelectedInMenu,
        selected,
        filterLocally,
        showSearch,
        query,
    ]);

    const showNoResults =
        showSearch &&
        query.trim().length > 0 &&
        filtered.length === 0 &&
        !searchTooShort;

    const selectedOption = !isMulti
        ? options.find((o) => String(o.value) === selected[0])
        : undefined;

    let triggerLabel = placeholder;
    if (hasValue && isMulti && multiDisplay === 'count') {
        triggerLabel =
            selected.length === 1
                ? '1 selecionado'
                : `${selected.length} selecionados`;
    } else if (hasValue && isMulti) {
        const labels = options
            .filter((o) => selected.includes(String(o.value)))
            .map((o) => o.label);
        triggerLabel = labels.length ? labels.join(', ') : placeholder;
    } else if (hasValue) {
        triggerLabel = selectedOption?.label ?? placeholder;
    }

    // Como o watch(query) do Vue: avisa só quando o termo muda de fato.
    function updateQuery(next: string) {
        setActive(-1);
        if (next === query) return;
        setQuery(next);
        onSearch?.(next);
    }

    function emit(next: string | string[]) {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    }

    function close() {
        setOpen(false);
        updateQuery('');
    }

    function isInside(node: EventTarget | null) {
        if (!(node instanceof Node)) return false;
        return [anchorRef, triggerRef, contentRef].some((r) =>
            r.current?.contains(node),
        );
    }

    function markFocused() {
        focusedRef.current = true;
    }

    // onBlur do RHF: o campo só "perde o foco" quando ele sai do conjunto
    // gatilho + popover (ir do gatilho para a lista não conta).
    function leave() {
        if (!focusedRef.current) return;
        focusedRef.current = false;
        onBlur?.();
    }

    function handleTriggerBlur(event: FocusEvent<HTMLButtonElement>) {
        if (event.relatedTarget === null) {
            if (!open) leave();
        } else if (!isInside(event.relatedTarget)) {
            leave();
        }
    }

    function handleContentBlur(event: FocusEvent<HTMLDivElement>) {
        // Sem relatedTarget (clique fora em área sem foco), quem cuida é o
        // onPointerDownOutside.
        if (event.relatedTarget !== null && !isInside(event.relatedTarget))
            leave();
    }

    function handleOpenChange(next: boolean) {
        if (disabled) return;
        if (next) {
            setOpen(true);
            const current = options.findIndex(
                (o) => String(o.value) === selected[0],
            );
            setActive(isMulti ? -1 : current);
            onOpen?.();
        } else {
            close();
            onClose?.();
        }
    }

    function selectOption(option: SelectOption) {
        if (option.disabled) return;
        const val = String(option.value);

        if (isMulti) {
            emit(
                selected.includes(val)
                    ? selected.filter((v) => v !== val)
                    : [...selected, val],
            );
        } else {
            emit(val);
            close();
            onClose?.();
            leave();
        }
    }

    function moveActive(direction: 1 | -1 | 'first' | 'last') {
        const enabled = filtered
            .map((o, index) => ({ o, index }))
            .filter(({ o }) => !o.disabled)
            .map(({ index }) => index);
        if (enabled.length === 0) return;

        if (direction === 'first') return setActive(enabled[0]);
        if (direction === 'last') return setActive(enabled[enabled.length - 1]);

        const pos = enabled.indexOf(active);
        if (pos === -1) {
            setActive(
                direction === 1 ? enabled[0] : enabled[enabled.length - 1],
            );
            return;
        }
        const next = Math.min(Math.max(pos + direction, 0), enabled.length - 1);
        setActive(enabled[next]);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        const inSearch = event.target === searchRef.current;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveActive(1);
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveActive(-1);
                break;
            case 'Home':
                if (inSearch) return;
                event.preventDefault();
                moveActive('first');
                break;
            case 'End':
                if (inSearch) return;
                event.preventDefault();
                moveActive('last');
                break;
            case 'Enter':
            case ' ':
                if (event.key === ' ' && inSearch) return;
                if (active >= 0 && filtered[active]) {
                    event.preventDefault();
                    selectOption(filtered[active]);
                }
                break;
        }
    }

    const optionId = (index: number) => `${uid}-option-${index}`;
    const activeDescendant =
        active >= 0 && filtered[active] ? optionId(active) : undefined;

    // Mantém visível o item ativo (ao abrir, o selecionado; depois, o das setas).
    // Callback ref porque o Portal do Radix só monta a lista um render depois.
    const scrollActiveIntoView = (element: HTMLDivElement | null) => {
        element?.scrollIntoView?.({ block: 'nearest' });
    };

    const popoverContent = (
        <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content
                ref={contentRef}
                align="start"
                sideOffset={6}
                collisionPadding={8}
                onOpenAutoFocus={(event) => {
                    event.preventDefault();
                    (showSearch
                        ? searchRef.current
                        : listboxRef.current
                    )?.focus();
                }}
                onPointerDownOutside={(event) => {
                    if (!isInside(event.target)) leave();
                }}
                onFocus={markFocused}
                onBlur={handleContentBlur}
                onKeyDown={handleKeyDown}
                className={dsCn(
                    'data-[state=open]:slide-in-from-top-1.5 z-[11010] flex flex-col overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-surface-default font-ds shadow-ds-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                    compactTriggerLabel
                        ? 'w-72'
                        : 'w-[var(--radix-popper-anchor-width)]',
                )}
            >
                {showSearch && (
                    <div className="flex items-center gap-2 border-b border-ds-border-subtle px-3 py-2">
                        <Search
                            aria-hidden="true"
                            className="size-4 shrink-0 text-ds-content-subtle"
                        />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            placeholder={searchPlaceholder}
                            aria-label={searchPlaceholder}
                            aria-controls={listboxId}
                            aria-activedescendant={activeDescendant}
                            onChange={(event) =>
                                updateQuery(event.target.value)
                            }
                            className="min-w-0 flex-1 border-none bg-transparent font-ds text-ds-body-xs text-ds-content-primary outline-none placeholder:text-ds-content-subtle"
                        />
                        {query && (
                            <button
                                type="button"
                                aria-label="Limpar busca"
                                onClick={() => {
                                    updateQuery('');
                                    searchRef.current?.focus();
                                }}
                                className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0 text-ds-content-subtle hover:bg-ds-surface-subtle hover:text-ds-content-primary"
                            >
                                <X aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                    </div>
                )}

                <div
                    ref={listboxRef}
                    id={listboxId}
                    role="listbox"
                    tabIndex={-1}
                    aria-multiselectable={isMulti || undefined}
                    aria-labelledby={label ? labelId : undefined}
                    aria-activedescendant={activeDescendant}
                    className={dsCn(
                        'max-h-60 overflow-y-auto p-1 outline-none ds-dark:[color-scheme:dark]',
                        filtered.length === 0 &&
                            !searchTooShort &&
                            !showNoResults &&
                            'max-h-0 p-0',
                    )}
                >
                    {filtered.map((option, index) => {
                        const isSelected = selected.includes(
                            String(option.value),
                        );
                        return (
                            <div
                                key={option.value}
                                ref={
                                    index === active
                                        ? scrollActiveIntoView
                                        : undefined
                                }
                                id={optionId(index)}
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={option.disabled || undefined}
                                data-active={index === active || undefined}
                                onClick={() => selectOption(option)}
                                onMouseMove={() =>
                                    !option.disabled && setActive(index)
                                }
                                className={dsCn(
                                    'flex w-full cursor-pointer items-center gap-2 rounded-ds-md px-3 py-[9px] text-left text-ds-body-xs text-ds-content-primary transition-[background] duration-[120ms]',
                                    'data-[active]:bg-ds-surface-subtle',
                                    isSelected &&
                                        'bg-ds-primary-80/6 text-ds-primary-100 ds-dark:text-ds-primary-60',
                                    option.disabled &&
                                        'cursor-not-allowed text-ds-gray-40',
                                )}
                            >
                                {isMulti ? (
                                    <span
                                        aria-hidden="true"
                                        className={dsCn(
                                            'flex size-4 shrink-0 items-center justify-center rounded-ds-xs border-[1.5px] border-ds-border-subtle bg-ds-surface-default',
                                            isSelected &&
                                                'border-ds-primary-80 bg-ds-primary-80',
                                        )}
                                    >
                                        {isSelected && (
                                            <Check
                                                className="size-[11px] text-ds-white"
                                                strokeWidth={3.5}
                                            />
                                        )}
                                    </span>
                                ) : (
                                    !isSearch && (
                                        <span
                                            aria-hidden="true"
                                            className={dsCn(
                                                'relative size-4 shrink-0 rounded-full border-[1.5px] border-ds-border-subtle bg-ds-surface-default',
                                                isSelected &&
                                                    'border-ds-primary-80 after:absolute after:inset-[3px] after:rounded-full after:bg-ds-primary-80',
                                            )}
                                        />
                                    )
                                )}
                                {showFlags && <Flag code={option.flagCode} />}
                                <span className="flex-1 truncate">
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}

                    {(searchTooShort || showNoResults) && (
                        <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-ds-body-xs text-ds-content-subtle">
                            <Search aria-hidden="true" className="size-6" />
                            <span>
                                {searchTooShort
                                    ? `Digite ao menos ${minSearchLength} caracteres para buscar`
                                    : emptyMessage ||
                                      `Nenhum resultado para "${query.trim()}"`}
                            </span>
                        </div>
                    )}
                </div>

                {isMulti && (
                    <div
                        className={dsCn(
                            'flex items-center justify-between gap-2 border-t border-ds-border-subtle px-3 py-2',
                            hideApplyButton &&
                                !footerLinkLabel &&
                                'justify-center',
                        )}
                    >
                        {footerLinkLabel && (
                            <button
                                type="button"
                                onClick={() => {
                                    onFooterLinkClick?.();
                                    close();
                                    onClose?.();
                                }}
                                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-ds-md border-none bg-transparent px-2 py-1.5 font-ds text-ds-body-xs font-medium whitespace-nowrap text-ds-primary-80 transition-[background] duration-[120ms] hover:bg-ds-surface-brand-subtle"
                            >
                                <Plus aria-hidden="true" className="size-4" />
                                {footerLinkLabel}
                            </button>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                            <button
                                type="button"
                                disabled={!hasValue}
                                onClick={() => emit([])}
                                className="cursor-pointer rounded-ds-md border-none bg-transparent px-2 py-1.5 font-ds text-ds-body-xs text-ds-content-muted transition-[background,color] duration-[120ms] enabled:hover:bg-ds-surface-subtle enabled:hover:text-ds-content-primary disabled:cursor-not-allowed disabled:text-ds-gray-40"
                            >
                                Limpar
                            </button>
                            {!hideApplyButton && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        close();
                                        onApply?.();
                                        onClose?.();
                                        leave();
                                    }}
                                    className="cursor-pointer rounded-ds-md border-none bg-ds-primary-80 px-3.5 py-1.5 font-ds text-ds-body-xs font-medium text-ds-white transition-[background] duration-[120ms] hover:bg-ds-primary-100"
                                >
                                    Aplicar
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
    );

    if (compactTriggerLabel) {
        return (
            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <PopoverPrimitive.Trigger asChild>
                    <button
                        ref={mergedTriggerRef}
                        id={uid}
                        type="button"
                        disabled={disabled}
                        aria-haspopup="listbox"
                        onFocus={markFocused}
                        onBlur={handleTriggerBlur}
                        aria-label={`${compactTriggerLabel}: ${triggerLabel}`}
                        className={dsCn(
                            'flex shrink-0 cursor-pointer items-center gap-1 rounded-ds-sm border-none bg-transparent py-0 pr-2 pl-0 text-ds-content-subtle outline-none focus-visible:shadow-ds-focus disabled:cursor-not-allowed',
                            className,
                        )}
                    >
                        <Flag code={selectedOption?.flagCode} />
                        <ChevronDown
                            aria-hidden="true"
                            className={dsCn(
                                'size-3.5 transition-transform duration-200',
                                open && 'rotate-180',
                            )}
                        />
                    </button>
                </PopoverPrimitive.Trigger>
                {popoverContent}
            </PopoverPrimitive.Root>
        );
    }

    return (
        <DsFieldControl state={state} className={className}>
            {label && (
                <span id={labelId} className="contents">
                    <DsFieldLabel htmlFor={uid} disabled={disabled}>
                        {label}
                    </DsFieldLabel>
                </span>
            )}

            <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
                <PopoverPrimitive.Anchor asChild>
                    <div
                        ref={anchorRef}
                        className={dsCn(
                            fieldShellVariants({ state }),
                            'relative min-w-0 gap-0 p-0',
                            open && 'border-ds-primary-80 shadow-ds-focus',
                            open &&
                                state === 'error' &&
                                'border-ds-danger-80 shadow-[0_0_0_3px_rgba(242,74,76,0.15)]',
                            open &&
                                state === 'success' &&
                                'border-ds-success-80 shadow-[0_0_0_3px_rgba(75,216,150,0.15)]',
                            disabled &&
                                'pointer-events-none cursor-not-allowed bg-ds-surface-disabled',
                            iconLeft &&
                                (size === 'sm'
                                    ? '[&>svg:first-child]:ml-3'
                                    : '[&>svg:first-child]:ml-4'),
                        )}
                    >
                        {iconLeft}

                        <PopoverPrimitive.Trigger asChild>
                            <button
                                ref={mergedTriggerRef}
                                id={uid}
                                type="button"
                                name={name}
                                disabled={disabled}
                                aria-haspopup="listbox"
                                aria-labelledby={describedBy(
                                    label ? labelId : undefined,
                                    valueId,
                                )}
                                aria-describedby={helper ? helperId : undefined}
                                aria-invalid={state === 'error' || undefined}
                                onFocus={markFocused}
                                onBlur={handleTriggerBlur}
                                className={dsCn(
                                    'flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-none bg-transparent pr-0 text-left font-ds leading-[var(--ds-line-height-base)] outline-none disabled:cursor-not-allowed',
                                    size === 'sm'
                                        ? 'py-2 pl-3 text-ds-caption'
                                        : 'py-3 pl-4 text-ds-body-xs',
                                    iconLeft && 'pl-2',
                                )}
                            >
                                {showFlags && (
                                    <Flag code={selectedOption?.flagCode} />
                                )}
                                <span
                                    id={valueId}
                                    className={dsCn(
                                        'min-w-0 flex-1 truncate font-medium text-ds-content-primary',
                                        !hasValue &&
                                            'font-normal text-ds-content-subtle',
                                        disabled && 'text-ds-content-subtle',
                                    )}
                                >
                                    {triggerLabel}
                                </span>
                            </button>
                        </PopoverPrimitive.Trigger>

                        <span className="flex shrink-0 pr-1 [&_svg]:size-[18px]">
                            <DsFieldStateIcon state={state} />
                        </span>

                        <ChevronDown
                            aria-hidden="true"
                            className={dsCn(
                                'pointer-events-none mr-3 ml-2 size-4 shrink-0 text-ds-content-subtle transition-transform duration-200',
                                open && 'rotate-180',
                            )}
                        />
                    </div>
                </PopoverPrimitive.Anchor>

                {popoverContent}
            </PopoverPrimitive.Root>

            {helper && (
                <DsFieldHelper id={helperId} state={state}>
                    {helper}
                </DsFieldHelper>
            )}
        </DsFieldControl>
    );
}

export function DsFieldSelect(props: FieldSelectProps) {
    return <FieldSelectCore {...props} />;
}
