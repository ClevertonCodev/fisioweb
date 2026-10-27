import { DsFieldSelectOptions } from '../select/DsFieldSelectOptions';

import { DS_COUNTRY_OPTIONS } from './countries';
import type { CountrySelectProps } from './types';

export function DsCountrySelect({
    value,
    onValueChange,
    placeholder = 'Selecione o país de origem',
    searchPlaceholder = 'Buscar país…',
    state = 'default',
    disabled = false,
    ...props
}: CountrySelectProps) {
    return (
        <DsFieldSelectOptions
            {...props}
            value={value}
            options={DS_COUNTRY_OPTIONS}
            mode="search"
            placeholder={placeholder}
            searchPlaceholder={searchPlaceholder}
            state={state}
            disabled={disabled}
            onValueChange={(next) =>
                onValueChange?.(Array.isArray(next) ? (next[0] ?? '') : next)
            }
        />
    );
}
