import { X } from 'lucide-react';

import { dsCn } from '../utils/ds-cn';

export interface FilterChip {
    /** Identifica o filtro; volta no `onRemove`. */
    key: string;
    /** Nome do filtro (ex.: "Status"). Sem ele, o chip mostra só o valor. */
    label?: string;
    /** Valor aplicado (ex.: "Ativos"). */
    value: string;
}

export interface FilterChipsProps {
    chips: FilterChip[];
    onRemove: (chip: FilterChip) => void;
    /** Com ele, aparece o botão de limpar tudo depois dos chips. */
    onClear?: () => void;
    clearLabel?: string;
    className?: string;
}

function chipText(chip: FilterChip): string {
    return chip.label ? `${chip.label}: ${chip.value}` : chip.value;
}

/**
 * Filtros aplicados, um chip removível por filtro, para ficar logo abaixo da
 * linha de filtros. Sem filtros, não renderiza nada.
 */
export function DsFilterChips({
    chips,
    onRemove,
    onClear,
    clearLabel = 'Limpar filtros',
    className,
}: FilterChipsProps) {
    if (chips.length === 0) return null;

    return (
        <div
            className={dsCn(
                'flex flex-wrap items-center gap-2 font-ds',
                className,
            )}
        >
            <ul aria-label="Filtros aplicados" className="contents">
                {chips.map((chip) => {
                    const text = chipText(chip);
                    return (
                        <li
                            key={chip.key}
                            className="inline-flex h-8 items-center gap-1 rounded-ds-pill border border-ds-border-brand-subtle bg-ds-surface-brand-subtle pr-1 pl-3 text-[0.8125rem] leading-none font-medium text-ds-primary-100 ds-dark:text-ds-primary-40"
                        >
                            <span className="max-w-[240px] truncate">
                                {text}
                            </span>
                            <button
                                type="button"
                                aria-label={`Remover filtro ${text}`}
                                onClick={() => onRemove(chip)}
                                className="grid size-6 cursor-pointer place-items-center rounded-ds-full text-current opacity-70 transition-[opacity,background] outline-none hover:bg-ds-primary-80/10 hover:opacity-100 focus-visible:shadow-ds-focus"
                            >
                                <X className="size-3.5" aria-hidden="true" />
                            </button>
                        </li>
                    );
                })}
            </ul>
            {onClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="h-8 cursor-pointer rounded-ds-md px-2 text-[0.8125rem] font-medium text-ds-content-secondary transition-colors outline-none hover:text-ds-content-primary hover:underline focus-visible:shadow-ds-focus"
                >
                    {clearLabel}
                </button>
            )}
        </div>
    );
}
