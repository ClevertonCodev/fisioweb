import { COUNTRY_DIAL_CODES } from './countries';

// Formatação de telefone do DS.
// Aqui o Brasil tem o formato completo; os demais países usam DDI + dígitos em
// grupos de 3 (o último com até 4), sem depender de biblioteca.

const E164_MAX_DIGITS = 15;
const BRAZIL_MAX_DIGITS = 11;

export function normalizePhoneDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export function maxNationalDigits(country: string): number {
    if (country === 'BR') return BRAZIL_MAX_DIGITS;
    return E164_MAX_DIGITS - (COUNTRY_DIAL_CODES[country]?.length ?? 1);
}

/** Dígitos nacionais → "(84) 99999-9999" (formato do Brasil). */
export function formatNationalPhone(digits: string): string {
    const d = normalizePhoneDigits(digits).slice(0, BRAZIL_MAX_DIGITS);
    if (d.length === 0) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)
        return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function groupDigits(digits: string): string {
    const groups: string[] = [];
    let rest = digits;
    while (rest.length > 4) {
        groups.push(rest.slice(0, 3));
        rest = rest.slice(3);
    }
    if (rest) groups.push(rest);
    return groups.join(' ');
}

function formatBrazilNumber(d: string): string {
    if (d.length <= 2) return d;
    const area = d.slice(0, 2);
    const local = d.slice(2);
    if (local.length <= 4) return `${area} ${local}`;
    // Celular (9 dígitos locais) separa 5-4; fixo (8 dígitos) separa 4-4.
    const split = local.length === 9 ? 5 : 4;
    return `${area} ${local.slice(0, split)}-${local.slice(split)}`;
}

/** País + dígitos nacionais → "+55 84 99999-9999" / "+1 555 123 4567". */
export function formatInternationalPhone(
    country: string,
    digits: string,
): string {
    const d = normalizePhoneDigits(digits).slice(0, maxNationalDigits(country));
    if (!d) return '';
    const dial = COUNTRY_DIAL_CODES[country] ?? '';
    const body = country === 'BR' ? formatBrazilNumber(d) : groupDigits(d);
    return `+${dial} ${body}`;
}

/** Dígitos nacionais de um valor já formatado (sem o DDI, se houver). */
export function nationalDigitsOf(value: string, country: string): string {
    const digits = normalizePhoneDigits(value);
    if (!value.trim().startsWith('+')) return digits;
    const dial = COUNTRY_DIAL_CODES[country] ?? '';
    return digits.startsWith(dial) ? digits.slice(dial.length) : digits;
}

/** Mesma regra  */
export function getPhoneValidationError(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('+')) {
        if (!trimmed.includes(' ') || trimmed.length < 10)
            return 'Número inválido';

        const digits = normalizePhoneDigits(trimmed);
        if (digits.length < 10) return 'Número inválido';

        if (trimmed.startsWith('+55')) {
            return digits.length >= 12 && digits.length <= 13
                ? ''
                : 'Número inválido';
        }

        return '';
    }

    const digits = normalizePhoneDigits(trimmed);
    return digits.length === 10 || digits.length === 11
        ? ''
        : 'Número inválido';
}
