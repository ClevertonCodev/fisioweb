import { describe, expect, it } from 'vitest';

import {
    applyMask,
    formatCnh,
    formatCnpj,
    formatCpf,
    formatPassport,
    formatRg,
    getCnhValidationError,
    getCnpjValidationError,
    getCpfValidationError,
    getPassportValidationError,
    getRgValidationError,
    isValidCnpj,
    isValidCpf,
    maskedCaret,
} from '@/components/ds/document/brazilian-document';

// Só documentos fictícios ou gerados para teste.

describe('formatCpf', () => {
    it.each([
        ['', ''],
        ['123', '123'],
        ['1234', '123.4'],
        ['1234567', '123.456.7'],
        ['12345678909', '123.456.789-09'],
        ['123.456.789-09', '123.456.789-09'],
        ['123456789091234', '123.456.789-09'],
        ['12a3b', '123'],
    ])('"%s" vira "%s"', (raw, expected) => {
        expect(formatCpf(raw)).toBe(expected);
    });
});

describe('formatCnpj (alfanumérico)', () => {
    it.each([
        ['11222333000181', '11.222.333/0001-81'],
        ['11.222.333/0001-81', '11.222.333/0001-81'],
        ['12abc34501de35', '12.ABC.345/01DE-35'],
        ['12ABC34501DEXX', '12.ABC.345/01DE'],
        ['1122', '11.22'],
    ])('"%s" vira "%s"', (raw, expected) => {
        expect(formatCnpj(raw)).toBe(expected);
    });
});

describe('formatRg', () => {
    it.each([
        ['12.345.678-x', '12.345.678-X'],
        ['mg-12.345.678', 'MG-12.345.678'],
        ['12#34', '1234'],
        ['A'.repeat(25), 'A'.repeat(20)],
    ])('"%s" vira "%s"', (raw, expected) => {
        expect(formatRg(raw)).toBe(expected);
    });
});

describe('formatCnh e formatPassport', () => {
    it.each([
        ['123.456.789-01x', '12345678901'],
        ['123456789012345', '12345678901'],
    ])('CNH "%s" vira "%s"', (raw, expected) => {
        expect(formatCnh(raw)).toBe(expected);
    });

    it.each([
        ['ab123456', 'AB123456'],
        ['ab-123 456 789', 'AB1234567'],
    ])('passaporte "%s" vira "%s"', (raw, expected) => {
        expect(formatPassport(raw)).toBe(expected);
    });
});

describe('applyMask', () => {
    it('pula caractere que não serve no token e continua', () => {
        expect(applyMask('1a2b3', '###')).toBe('123');
    });

    it('o token "*" aceita letra e dígito e põe em maiúscula', () => {
        expect(applyMask('a1-b', '**.*')).toBe('A1.B');
    });

    it('não põe literal no fim sem próximo caractere', () => {
        expect(applyMask('123', '###.###')).toBe('123');
    });
});

describe('maskedCaret', () => {
    it('mantém o cursor depois do mesmo caractere significativo', () => {
        // "123.456.789-09" com o cursor depois do "4" (posição 5). Ao apagar o
        // "4", o texto cru vira "123.56.789-09" com o cursor em 4 (depois de "123.").
        // Reformatado: "123.567.890-9", e o cursor continua depois de "123.".
        expect(maskedCaret('123.56.789-09', 4, '123.567.890-9')).toBe(4);
    });

    it('no meio do valor, para logo depois do caractere digitado', () => {
        // Digitar "0" depois do "2" em "123.4": cru "1203.4", cursor em 3.
        expect(maskedCaret('1203.4', 3, '120.34')).toBe(3);
    });

    it('vai para o fim quando o cursor estava no fim', () => {
        expect(maskedCaret('1234', 4, '123.4')).toBe(5);
    });
});

describe('validações', () => {
    it('CPF', () => {
        expect(isValidCpf('123.456.789-09')).toBe(true);
        expect(isValidCpf('111.111.111-11')).toBe(false);
        expect(getCpfValidationError('')).toBe('');
        expect(getCpfValidationError('', true)).toBe('CPF é obrigatório');
        expect(getCpfValidationError('123.456')).toBe('CPF incompleto');
        expect(getCpfValidationError('123.456.789-00')).toBe('CPF inválido');
    });

    it('CNPJ numérico e alfanumérico', () => {
        expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
        expect(isValidCnpj('12.ABC.345/01DE-35')).toBe(true);
        expect(isValidCnpj('11.222.333/0001-80')).toBe(false);
        expect(getCnpjValidationError('', true)).toBe('CNPJ é obrigatório');
        expect(getCnpjValidationError('11.222')).toBe('CNPJ incompleto');
        expect(getCnpjValidationError('11.222.333/0001-80')).toBe(
            'CNPJ inválido',
        );
    });

    it('RG, CNH e passaporte', () => {
        expect(getRgValidationError('', true)).toBe('RG é obrigatório');
        expect(getRgValidationError('12.345.678-X')).toBe('');
        expect(getCnhValidationError('123')).toBe('CNH incompleta');
        expect(getCnhValidationError('', true)).toBe('CNH é obrigatória');
        expect(getPassportValidationError('AB12')).toBe(
            'Passaporte incompleto',
        );
        expect(getPassportValidationError('AB123456')).toBe('');
    });
});
