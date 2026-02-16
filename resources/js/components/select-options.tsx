import { ChevronDown } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

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
    name: string;
    options: SelectOption[];
    placeHolder?: string;
    isField?: boolean;
    disabled?: boolean;
    validade?: boolean;
    noLimitOptions?: boolean;
    searchable?: boolean;
    wrapperClassName?: string;
}

const sortedOptions = (options: SelectOption[]): SelectOption[] =>
    [...options].sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })
    );

function OptionDisplay({ option }: { option: SelectOption }) {
    return (
        <div className="flex items-center gap-2">
            {option.icon && <i className={option.icon} aria-hidden />}
            {option.img && (
                <img
                    src={option.img}
                    alt=""
                    className="h-9 w-14 rounded object-cover"
                />
            )}
            <span>{option.label}</span>
        </div>
    );
}

export function SelectOptions({
    value,
    onChange,
    name,
    options,
    placeHolder = 'Selecione uma opção',
    isField = false,
    disabled = false,
    validade = false,
    noLimitOptions = false,
    searchable = true,
    wrapperClassName,
}: SelectOptionsProps) {
    const selectWrapper = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInput = useRef<HTMLInputElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const optionsSelect = useMemo(() => sortedOptions(options), [options]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return optionsSelect;
        const term = searchTerm.toLowerCase();
        return optionsSelect.filter((opt) =>
            opt.label.toLowerCase().includes(term)
        );
    }, [optionsSelect, searchTerm]);

    const showSearch = searchable && optionsSelect.length > 7;

    const wrapperClass = useMemo(() => {
        const base = 'relative rounded-md bg-white';
        if (validade) return cn(base, 'border border-red-500');
        if (isField) return cn(base, 'h-full border-0');
        return cn(base, 'border border-gray-300');
    }, [validade, isField]);

    const positionDropdown = useCallback(() => {
        const wrapper = selectWrapper.current;
        const dropdown = dropdownRef.current;
        if (!wrapper || !dropdown) return;

        const rect = wrapper.getBoundingClientRect();

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
            dropdown.style.zIndex = '99999';
            dropdown.style.marginTop = '4px';
        }
    }, [noLimitOptions]);

    const toggleDropdown = useCallback(() => {
        if (disabled) return;

        setIsOpen((prev) => {
            const next = !prev;
            if (next) {
                setSearchTerm('');
                setTimeout(() => {
                    positionDropdown();
                    if (noLimitOptions) {
                        const scrollPosition =
                            window.pageYOffset ||
                            document.documentElement.scrollTop;
                        window.scrollTo(0, scrollPosition);
                    }
                    searchInput.current?.focus();
                }, 0);
            }
            return next;
        });
    }, [disabled, noLimitOptions, positionDropdown]);

    const selectOption = useCallback(
        (option: SelectOption) => {
            onChange(option);
            setIsOpen(false);
            setSearchTerm('');
        },
        [onChange]
    );

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const wrapper = selectWrapper.current;
        if (wrapper && !wrapper.contains(event.target as Node)) {
            setIsOpen(false);
            setSearchTerm('');
        }
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [handleClickOutside]);

    return (
        <div
            ref={selectWrapper}
            className={cn(wrapperClass, wrapperClassName)}
        >
            <input type="hidden" name={name} value={value?.value ?? ''} />
            <div
                className={cn(
                    'relative w-full overflow-visible',
                    isOpen && 'is-open'
                )}
            >
                <button
                    type="button"
                    onClick={toggleDropdown}
                    disabled={disabled}
                    className={cn(
                        'flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-2.5 py-2.5 text-sm transition-colors',
                        'hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
                        'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-gray-50 disabled:border-gray-200',
                        isField &&
                            'h-full border-0 bg-transparent rounded-none'
                    )}
                >
                    <div className="flex flex-1 items-center text-gray-700">
                        {value ? (
                            <OptionDisplay option={value} />
                        ) : (
                            <span className="text-gray-400">{placeHolder}</span>
                        )}
                    </div>
                    <ChevronDown
                        className={cn(
                            'ml-2 size-4 shrink-0 text-gray-500 transition-transform',
                            isOpen && 'rotate-180'
                        )}
                    />
                </button>

                {isOpen && (
                    <div
                        ref={dropdownRef}
                        className="absolute left-0 top-full z-[99999] mt-1 max-h-[250px] overflow-hidden rounded-md border border-gray-300 bg-white shadow-lg"
                        style={
                            noLimitOptions
                                ? undefined
                                : {
                                      width: '100%',
                                  }
                        }
                    >
                        {showSearch && (
                            <div className="border-b border-gray-100 p-2">
                                <input
                                    ref={searchInput}
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Buscar..."
                                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}
                        <div className="max-h-[200px] overflow-y-auto">
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => selectOption(option)}
                                    className={cn(
                                        'flex w-full cursor-pointer items-center border-b border-gray-100 px-3 py-2.5 text-left text-sm transition-colors last:border-b-0',
                                        'hover:bg-primary hover:text-primary-foreground',
                                        value?.value === option.value &&
                                            'bg-primary font-medium text-primary-foreground'
                                    )}
                                >
                                    <OptionDisplay option={option} />
                                </button>
                            ))}
                            {filteredOptions.length === 0 && (
                                <div className="px-3 py-4 text-center text-sm italic text-gray-500">
                                    Nenhum resultado encontrado
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
