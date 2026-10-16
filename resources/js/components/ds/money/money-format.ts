import type { MoneyCurrency } from './types';

// e 2 casas, para qualquer moeda. A digitação entra pelos centavos (como numa
// maquininha): "9990" vira 99,90.

const PRECISION = 2;

const CURRENCY_PREFIX: Record<MoneyCurrency, string> = {
    BRL: 'R$ ',
    USD: '$ ',
    EUR: '€ ',
};

export function moneyPrefix(currency: MoneyCurrency): string {
    return CURRENCY_PREFIX[currency];
}

/** 1234.56 → "R$ 1.234,56". `null` e NaN viram zero. */
export function formatMoney(
    value: number | null | undefined,
    currency: MoneyCurrency,
): string {
    const safe =
        value === null || value === undefined || Number.isNaN(value)
            ? 0
            : value;
    const [integer, decimals] = Math.abs(safe).toFixed(PRECISION).split('.');
    const withThousands = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const sign = safe < 0 ? '-' : '';

    return `${moneyPrefix(currency)}${sign}${withThousands},${decimals}`;
}

/** `longer` é `shorter` com exatamente um dígito a mais, em qualquer posição. */
function differsByOneDigit(shorter: string, longer: string): boolean {
    if (longer.length !== shorter.length + 1) return false;
    let i = 0;
    while (i < shorter.length && shorter[i] === longer[i]) i++;
    return longer.slice(i + 1) === shorter.slice(i);
}

/** `inputType` de colar, arrastar e corretor: o texto novo substitui o campo. */
const REPLACING_INPUT_TYPES = new Set([
    'insertFromPaste',
    'insertFromPasteAsQuotation',
    'insertFromDrop',
    'insertFromYank',
    'insertReplacementText',
]);

/**
 * Aplica a edição como numa maquininha, sem depender de onde está o cursor:
 * dígito digitado entra no fim, apagar tira o último. Isso só vale para a
 * edição de um dígito; qualquer outra mudança (colar, selecionar tudo e
 * digitar) substitui o campo pelos dígitos novos.
 *
 * `inputType` (do `InputEvent` nativo) desfaz a dúvida: colar "R$ 80,00" sobre
 * "R$ 0,00" tem os mesmos dígitos de digitar um "8", mas é substituição.
 */
export function applyMoneyEdit(
    previousDisplay: string,
    nextRaw: string,
    currency: MoneyCurrency,
    maxDigits?: number,
    inputType?: string,
): number {
    if (
        (inputType && REPLACING_INPUT_TYPES.has(inputType)) ||
        !nextRaw.includes(moneyPrefix(currency).trim())
    ) {
        return parseMoneyInput(nextRaw, maxDigits);
    }

    const previous = previousDisplay.replace(/\D/g, '');
    const next = nextRaw.replace(/\D/g, '');
    let digits = next;

    if (differsByOneDigit(previous, next)) {
        let i = 0;
        while (i < previous.length && previous[i] === next[i]) i++;
        digits = previous + next[i];
    } else if (differsByOneDigit(next, previous)) {
        digits = previous.slice(0, -1);
    }

    return parseMoneyInput(digits, maxDigits);
}

/**
 * Texto digitado → valor numérico, lendo só os dígitos como centavos.
 * `maxDigits` limita o total de dígitos (com os centavos): 5 → no máximo 999,99.
 */
export function parseMoneyInput(text: string, maxDigits?: number): number {
    const digits = text.replace(/\D/g, '').replace(/^0+/, '');
    if (digits === '') return 0;

    const limit = maxDigits && maxDigits > PRECISION ? maxDigits : undefined;
    const cents =
        limit && digits.length > limit
            ? 10 ** limit - 1
            : Number.parseInt(digits, 10);

    return cents / 10 ** PRECISION;
}
