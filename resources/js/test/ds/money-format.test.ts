import { describe, expect, it } from 'vitest';

import {
    applyMoneyEdit,
    formatMoney,
    parseMoneyInput,
} from '@/components/ds/money/money-format';

describe('formatMoney', () => {
    it.each([
        [1234.56, 'BRL', 'R$ 1.234,56'],
        [10, 'EUR', '€ 10,00'],
        [0.5, 'USD', '$ 0,50'],
        [1234567.8, 'BRL', 'R$ 1.234.567,80'],
        [null, 'BRL', 'R$ 0,00'],
        [Number.NaN, 'USD', '$ 0,00'],
    ] as const)('%s em %s vira "%s"', (value, currency, expected) => {
        expect(formatMoney(value, currency)).toBe(expected);
    });
});

describe('parseMoneyInput', () => {
    it.each([
        ['R$ 99,90', undefined, 99.9],
        ['123456', undefined, 1234.56],
        ['R$ 0,001', undefined, 0.01],
        ['', undefined, 0],
        ['abc', undefined, 0],
        ['R$ 1.234,567', undefined, 12345.67],
        // maxDigits = 5: no máximo 999,99
        ['9999999', 5, 999.99],
    ] as const)('"%s" (maxDigits %s) vira %s', (text, maxDigits, expected) => {
        expect(parseMoneyInput(text, maxDigits)).toBe(expected);
    });
});

describe('applyMoneyEdit (o dígito entra sempre no fim, como numa maquininha)', () => {
    it.each([
        ['R$ 0,00', 'R$ 0,001', 0.01],
        // Cursor no começo do campo: o dígito ainda entra no fim.
        ['R$ 0,00', '1R$ 0,00', 0.01],
        ['R$ 0,01', 'R$ 0,501', 0.15],
        // Apagar em qualquer posição tira o último dígito.
        ['R$ 1,50', 'R$ 1,0', 0.15],
        ['R$ 1,50', 'R$ ,50', 0.15],
        // Campo todo substituído (selecionar tudo e digitar/colar).
        ['R$ 1,50', '9', 0.09],
        ['R$ 1,50', '', 0],
    ] as const)('"%s" → "%s" vira %s', (prev, next, expected) => {
        expect(applyMoneyEdit(prev, next, 'BRL')).toBe(expected);
    });

    it.each([
        // Colar um valor formatado (com prefixo) por cima do campo.
        ['R$ 0,00', 'R$ 1.234,56', 1234.56],
        ['R$ 5,00', 'R$ 10,00', 10],
    ] as const)(
        'colar "%s" → "%s" usa os dígitos colados (%s)',
        (prev, next, expected) => {
            expect(applyMoneyEdit(prev, next, 'BRL')).toBe(expected);
        },
    );

    it.each([
        // Um dígito de diferença: sem o inputType seria lido como tecla.
        ['R$ 0,00', 'R$ 80,00', 'insertFromPaste', 80],
        ['R$ 1,00', 'R$ 51,00', 'insertFromPaste', 51],
        ['R$ 1,50', 'R$ 21,50', 'insertFromDrop', 21.5],
        ['R$ 3,00', 'R$ 13,00', 'insertReplacementText', 13],
        // Tecla de verdade continua como maquininha.
        ['R$ 0,00', 'R$ 80,00', 'insertText', 0.08],
    ] as const)(
        '"%s" → "%s" com inputType %s vira %s',
        (prev, next, inputType, expected) => {
            expect(
                applyMoneyEdit(prev, next, 'BRL', undefined, inputType),
            ).toBe(expected);
        },
    );

    it('respeita maxDigits', () => {
        expect(applyMoneyEdit('R$ 99,99', 'R$ 99,991', 'BRL', 4)).toBe(99.99);
    });
});
