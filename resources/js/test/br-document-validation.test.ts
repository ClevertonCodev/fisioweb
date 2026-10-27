import { describe, expect, it } from 'vitest';

import { isValidCrefitoRegistration } from '@/lib/br-document-validation';

describe('isValidCrefitoRegistration', () => {
    it('aceita o formato real de fisioterapeuta (número + sufixo -F)', () => {
        expect(isValidCrefitoRegistration('123456-F')).toBe(true);
        expect(isValidCrefitoRegistration('12345-F')).toBe(true);
    });

    it('aceita terapeuta ocupacional (sufixo -TO)', () => {
        expect(isValidCrefitoRegistration('12345-TO')).toBe(true);
    });

    it('aceita sem separador antes do sufixo', () => {
        expect(isValidCrefitoRegistration('123456F')).toBe(true);
    });

    it('aceita região opcional e prefixo CREFITO', () => {
        expect(isValidCrefitoRegistration('3/12345-F')).toBe(true);
        expect(isValidCrefitoRegistration('CREFITO-3/12345-F')).toBe(true);
        expect(isValidCrefitoRegistration('CREFITO 3/12345-TO')).toBe(true);
    });

    it('mantém compatibilidade com o formato legado UF + número', () => {
        expect(isValidCrefitoRegistration('MG-123456')).toBe(true);
        expect(isValidCrefitoRegistration('SP 123456-G')).toBe(true);
    });

    it('rejeita valor sem nenhuma letra (apenas número)', () => {
        expect(isValidCrefitoRegistration('123456')).toBe(false);
    });

    it('rejeita valor vazio ou curto demais', () => {
        expect(isValidCrefitoRegistration('')).toBe(false);
        expect(isValidCrefitoRegistration('F')).toBe(false);
        expect(isValidCrefitoRegistration('12F')).toBe(false);
    });

    it('rejeita valor longo demais (> 30 caracteres)', () => {
        expect(isValidCrefitoRegistration('1234567890123456789012345678-F')).toBe(
            false,
        );
    });

    it('rejeita texto que não segue o padrão', () => {
        expect(isValidCrefitoRegistration('fisioterapeuta')).toBe(false);
        expect(isValidCrefitoRegistration('abc-def')).toBe(false);
    });
});
