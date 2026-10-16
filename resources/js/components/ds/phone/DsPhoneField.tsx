import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import {
    DsOutlinedField,
    outlinedInputClass,
} from '../document/DsOutlinedField';
import { FieldSelectCore } from '../select/DsFieldSelect';

import { countryFromInternational, DS_COUNTRY_OPTIONS } from './countries';
import {
    formatInternationalPhone,
    formatNationalPhone,
    maxNationalDigits,
    nationalDigitsOf,
    normalizePhoneDigits,
} from './phone';
import type { PhoneFieldProps } from './types';

/**
 * Telefone com seletor de país (no Vue: vue-tel-input). Com seletor, emite o
 * número internacional e o campo mostra só a parte nacional; sem seletor, usa o
 * formato nacional brasileiro.
 */
export function DsPhoneField({
    value,
    onValueChange,
    label = '',
    required = false,
    disabled = false,
    invalid = false,
    helperText = '',
    placeholder = '',
    showCountrySelector = true,
    defaultCountry = 'BR',
    id,
    className,
    ref,
    ...rest
}: PhoneFieldProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
    const [uncontrolled, setUncontrolled] = useState('');
    const current = value ?? uncontrolled;

    // `value` trocado por fora (`reset({ tel: '' })`, outro registro na mesma
    // gaveta): o país guardado volta ao do valor novo, ou ao padrão, e não vaza
    // para o próximo. O que este campo emite também passa por `lastValue`, então
    // não conta. `value` undefined (reset sem defaultValues) não muda nada.
    const [lastValue, setLastValue] = useState(value);
    if (value !== lastValue) {
        setLastValue(value);
        if (value !== undefined) {
            setSelectedCountry(
                countryFromInternational(value, selectedCountry) ??
                    defaultCountry,
            );
        }
    }

    const country = showCountrySelector
        ? (countryFromInternational(current, selectedCountry) ??
          selectedCountry)
        : 'BR';
    const digits = nationalDigitsOf(current, country);

    // No campo aparece só a parte nacional ("84 99999-9999").
    const displayed = showCountrySelector
        ? formatInternationalPhone(country, digits).replace(/^\+\d+ ?/, '')
        : formatNationalPhone(digits);

    function emit(next: string) {
        setLastValue(next);
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    }

    function formatFor(targetCountry: string, nextDigits: string) {
        return showCountrySelector
            ? formatInternationalPhone(targetCountry, nextDigits)
            : formatNationalPhone(nextDigits);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const raw = event.target.value;
        // Colado ou autopreenchido com DDI ("+55 84 …"): o DDI escolhe o país
        // (sem seletor, é sempre Brasil) e sai dos dígitos antes do corte.
        const international = raw.trim().startsWith('+');
        const target =
            showCountrySelector && international
                ? (countryFromInternational(raw, country) ?? country)
                : country;
        const national = international
            ? nationalDigitsOf(raw, target)
            : normalizePhoneDigits(raw);

        // Guarda o país em uso: apagar o número não volta ao país padrão.
        if (showCountrySelector) setSelectedCountry(target);
        emit(formatFor(target, national.slice(0, maxNationalDigits(target))));
    }

    function handleCountryChange(next: string | string[]) {
        const code = Array.isArray(next) ? next[0] : next;
        if (!code) return;
        setSelectedCountry(code);
        if (digits) emit(formatFor(code, digits));
    }

    return (
        <DsOutlinedField
            inputId={inputId}
            label={label}
            required={required}
            disabled={disabled}
            invalid={invalid}
            helperId={helperId}
            helperText={helperText}
            className={className}
        >
            <div className="flex items-center">
                {showCountrySelector && (
                    <FieldSelectCore
                        compactTriggerLabel="País"
                        mode="search"
                        options={DS_COUNTRY_OPTIONS}
                        value={country}
                        onValueChange={handleCountryChange}
                        searchPlaceholder="Buscar país…"
                        disabled={disabled}
                        showFlags
                        className="mr-2"
                    />
                )}
                <input
                    {...rest}
                    ref={ref}
                    id={inputId}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={displayed}
                    placeholder={
                        showCountrySelector
                            ? ''
                            : placeholder || '(00) 00000-0000'
                    }
                    disabled={disabled}
                    required={required}
                    aria-invalid={invalid ? 'true' : 'false'}
                    aria-describedby={invalid ? helperId : undefined}
                    onChange={handleChange}
                    className={outlinedInputClass}
                />
            </div>
        </DsOutlinedField>
    );
}
