import { describe, expect, it } from 'vitest';

import { patientDisplayName } from '@/application/clinic/patient-display-name';

describe('patientDisplayName', () => {
    it('usa o apelido quando o switch está ligado e o apelido não está vazio', () => {
        expect(
            patientDisplayName({
                name: 'Ana Lima',
                apelido: 'Aninha',
                useApelido: true,
            }),
        ).toBe('Aninha');
    });

    it('fica com o nome legal se o switch está desligado', () => {
        expect(
            patientDisplayName({
                name: 'Ana Lima',
                apelido: 'Aninha',
                useApelido: false,
            }),
        ).toBe('Ana Lima');
    });

    it('fica com o nome legal se o apelido veio só com espaço', () => {
        expect(
            patientDisplayName({
                name: 'Ana Lima',
                apelido: '   ',
                useApelido: true,
            }),
        ).toBe('Ana Lima');
    });
});
