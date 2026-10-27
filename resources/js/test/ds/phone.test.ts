import { describe, expect, it } from 'vitest';

import {
    countryFromInternational,
    DS_COUNTRY_OPTIONS,
} from '@/components/ds/phone/countries';
import {
    formatInternationalPhone,
    formatNationalPhone,
    getPhoneValidationError,
    nationalDigitsOf,
} from '@/components/ds/phone/phone';

// Só números fictícios.

describe('getPhoneValidationError (portado do Vue)', () => {
    it('vazio não tem erro', () => {
        expect(getPhoneValidationError('')).toBe('');
        expect(getPhoneValidationError('   ')).toBe('');
    });

    it('rejeita nacional sem 10 ou 11 dígitos', () => {
        expect(getPhoneValidationError('849454')).toBe('Número inválido');
    });

    it('aceita nacional válido', () => {
        expect(getPhoneValidationError('(84) 99999-9999')).toBe('');
        expect(getPhoneValidationError('8433334444')).toBe('');
    });

    it('rejeita internacional incompleto', () => {
        expect(getPhoneValidationError('+55 8499')).toBe('Número inválido');
        expect(getPhoneValidationError('+55 849454')).toBe('Número inválido');
    });

    it('o Brasil (+55) exige 12 ou 13 dígitos; outro país, só 10', () => {
        // Os mesmos 9 dígitos nacionais: inválido no Brasil, válido nos EUA.
        expect(getPhoneValidationError('+55 84 9999 999')).toBe(
            'Número inválido',
        );
        expect(getPhoneValidationError('+1 555 123 456')).toBe('');
        expect(getPhoneValidationError('+55 84 99999 99999')).toBe(
            'Número inválido',
        );
    });

    it('aceita internacional válido', () => {
        expect(getPhoneValidationError('+55 84 99999 9999')).toBe('');
        expect(getPhoneValidationError('+1 555 123 4567')).toBe('');
    });
});

describe('formatInternationalPhone', () => {
    it.each([
        ['BR', '84999999999', '+55 84 99999-9999'],
        ['BR', '8433334444', '+55 84 3333-4444'],
        ['BR', '849', '+55 84 9'],
        ['BR', '84', '+55 84'],
        ['US', '5551234567', '+1 555 123 4567'],
        ['PT', '912345678', '+351 912 345 678'],
        ['AR', '1123456789', '+54 112 345 6789'],
        ['BR', '', ''],
    ])('%s + "%s" vira "%s"', (country, digits, expected) => {
        expect(formatInternationalPhone(country, digits)).toBe(expected);
    });

    it('limita o número de dígitos (Brasil: 11)', () => {
        expect(formatInternationalPhone('BR', '849999999991234')).toBe(
            '+55 84 99999-9999',
        );
    });

    it('o resultado passa na validação do DS', () => {
        expect(
            getPhoneValidationError(
                formatInternationalPhone('BR', '84999999999'),
            ),
        ).toBe('');
        expect(
            getPhoneValidationError(
                formatInternationalPhone('US', '5551234567'),
            ),
        ).toBe('');
    });
});

describe('formatNationalPhone', () => {
    it.each([
        ['', ''],
        ['8', '(8'],
        ['849', '(84) 9'],
        ['8433334444', '(84) 3333-4444'],
        ['84999999999', '(84) 99999-9999'],
    ])('"%s" vira "%s"', (digits, expected) => {
        expect(formatNationalPhone(digits)).toBe(expected);
    });
});

describe('nationalDigitsOf', () => {
    it('tira o DDI de um valor internacional', () => {
        expect(nationalDigitsOf('+55 84 99999-9999', 'BR')).toBe('84999999999');
        expect(nationalDigitsOf('+1 555 123 4567', 'US')).toBe('5551234567');
    });

    it('valor nacional vira só dígitos', () => {
        expect(nationalDigitsOf('(84) 3333-4444', 'BR')).toBe('8433334444');
    });
});

describe('países', () => {
    it('tem nomes em português, ordenados, e o Brasil com bandeira', () => {
        const brasil = DS_COUNTRY_OPTIONS.find((o) => o.value === 'BR');
        expect(brasil).toEqual({
            value: 'BR',
            label: 'Brasil',
            flagCode: 'BR',
        });
        const labels = DS_COUNTRY_OPTIONS.map((o) => o.label);
        expect(labels).toEqual(
            [...labels].sort((a, b) => a.localeCompare(b, 'pt-BR')),
        );
        expect(DS_COUNTRY_OPTIONS.length).toBeGreaterThan(200);
    });

    it('descobre o país pelo DDI, preferindo o atual quando o DDI é dividido', () => {
        expect(countryFromInternational('+55 84 9')).toBe('BR');
        expect(countryFromInternational('+351 912')).toBe('PT');
        expect(countryFromInternational('+1 555')).toBe('US');
        expect(countryFromInternational('+1 416', 'CA')).toBe('CA');
        expect(countryFromInternational('84 9')).toBeUndefined();
    });
});
