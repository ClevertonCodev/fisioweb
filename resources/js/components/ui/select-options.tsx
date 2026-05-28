import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SelectOption {
    label: string;
    value: string;
    icon?: string;
    img?: string;
}

export interface SelectOptionsProps {
    value: SelectOption | null;
    onChange: (value: SelectOption | null) => void;
    name?: string;
    options: SelectOption[];
    placeholder?: string;
    isField?: boolean;
    disabled?: boolean;
    hasError?: boolean;
    noLimitOptions?: boolean;
    searchable?: boolean;
    className?: string;
}

const sortedOptions = (opts: SelectOption[]) =>
    [...opts].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }));

export function SelectOptions({
    value,
    onChange,
    name,
    options,
    placeholder = 'Selecione uma opção',
    isField = false,
    disabled = false,
    hasError = false,
    noLimitOptions = false,
    searchable = true,
    className,
}: SelectOptionsProps) {
    const wrapperRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');

    const optionsSorted = React.useMemo(() => sortedOptions(options), [options]);

    const filteredOptions = React.useMemo(() => {
        if (!searchTerm.trim()) return optionsSorted;
        const term = searchTerm.toLowerCase();
        return optionsSorted.filter((opt) => opt.label.toLowerCase().includes(term));
    }, [optionsSorted, searchTerm]);

    const showSearch = searchable && optionsSorted.length > 7;

    const wrapperClass = cn(
        'relative w-full overflow-visible',
        !isField && 'rounded-md border bg-background',
        !isField && 'border-input',
        hasError && 'border-destructive',
        isField && 'h-full',
        className,
    );

    const triggerClass = cn(
        'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
        isOpen && 'ring-2 ring-ring ring-offset-2',
        disabled && 'cursor-not-allowed opacity-60',
        isField && 'h-full border-0 bg-transparent focus:ring-0',
    );

    const positionDropdown = React.useCallback(() => {
        if (!wrapperRef.current || !dropdownRef.current) return;
        const rect = wrapperRef.current.getBoundingClientRect();
        const dropdown = dropdownRef.current;
        if (noLimitOptions) {
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${rect.bottom + 6}px`;
            dropdown.style.left = `${rect.left}px`;
            dropdown.style.width = `${rect.width}px`;
            dropdown.style.zIndex = '99999';
        } else {
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.left = '0';
            dropdown.style.width = '100%';
            dropdown.style.zIndex = '9999';
            dropdown.style.marginTop = '4px';
        }
    }, [noLimitOptions]);

    const open = React.useCallback(() => {
        if (disabled) return;
        setIsOpen(true);
        setSearchTerm('');
        requestAnimationFrame(() => {
            positionDropdown();
            if (noLimitOptions) {
                const scrollY = window.scrollY ?? document.documentElement.scrollTop;
                window.scrollTo(0, scrollY);
            }
            if (showSearch && searchInputRef.current) {
                searchInputRef.current.focus();
            }
        });
    }, [disabled, noLimitOptions, positionDropdown, showSearch]);

    const close = React.useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
    }, []);

    const selectOption = React.useCallback(
        (option: SelectOption) => {
            onChange(option);
            close();
        },
        [onChange, close],
    );

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                close();
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [close]);

    return (
        <div ref={wrapperRef} className={wrapperClass}>
            <div
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-disabled={disabled}
                aria-invalid={hasError}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isOpen) return;
                        open();
                    }
                    if (e.key === 'Escape') close();
                }}
                className={cn(
                    'custom-select-options',
                    isOpen && 'is-open',
                    disabled && 'is-disabled',
                )}
            >
                <button
                    type="button"
                    name={name}
                    disabled={disabled}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        open();
                    }}
                    className={triggerClass}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-left">
                        {value ? (
                            <div className="flex items-center gap-2">
                                {value.icon && <i className={cn(value.icon, 'h-5 w-5 shrink-0')} />}
                                {value.img && (
                                    <img
                                        src={value.img}
                                        alt=""
                                        className="h-5 w-5 shrink-0 object-contain"
                                    />
                                )}
                                <span className="truncate">{value.label}</span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 shrink-0 opacity-50 transition-transform',
                            isOpen && 'rotate-180',
                        )}
                    />
                </button>

                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="border-input bg-popover text-popover-foreground rounded-md border shadow-md"
                        role="listbox"
                    >
                        {showSearch && (
                            <div className="border-border border-b p-2">
                                <Input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-9"
                                />
                            </div>
                        )}
                        <div className="max-h-[250px] overflow-y-auto p-1">
                            {filteredOptions.length === 0 ? (
                                <div className="text-muted-foreground py-4 text-center text-sm italic">
                                    Nenhum resultado encontrado
                                </div>
                            ) : (
                                filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        role="option"
                                        aria-selected={value?.value === option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectOption(option);
                                        }}
                                        className={cn(
                                            'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground flex cursor-pointer items-center gap-2 rounded-sm py-2 pr-3 pl-2 text-sm transition-colors outline-none select-none',
                                            value?.value === option.value &&
                                                'bg-accent text-accent-foreground font-medium',
                                        )}
                                    >
                                        {option.icon && (
                                            <i className={cn(option.icon, 'h-5 w-5 shrink-0')} />
                                        )}
                                        {option.img && (
                                            <img
                                                src={option.img}
                                                alt=""
                                                className="h-5 w-5 shrink-0 object-contain"
                                            />
                                        )}
                                        <span className="truncate">{option.label}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
