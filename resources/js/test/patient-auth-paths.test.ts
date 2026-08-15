import { describe, expect, it } from 'vitest';

import {
    patientLoginPath,
    patientLoginPathWithNext,
    patientPostLoginPath,
    safePatientNext,
} from '@/application/patient/patient-auth-paths';

describe('patientLoginPath', () => {
    it('usa o slug quando existe', () => {
        expect(patientLoginPath('clinica-cleverton')).toBe(
            '/clinica-cleverton/paciente/login',
        );
    });

    it('cai na rota sem slug quando não há contexto', () => {
        expect(patientLoginPath()).toBe('/paciente/login');
        expect(patientLoginPath(null)).toBe('/paciente/login');
    });
});

describe('patientLoginPathWithNext', () => {
    it('codifica o destino de retorno', () => {
        expect(
            patientLoginPathWithNext(
                'clinica-cleverton',
                '/clinica-cleverton/paciente/programas/abc',
            ),
        ).toBe(
            '/clinica-cleverton/paciente/login?next=%2Fclinica-cleverton%2Fpaciente%2Fprogramas%2Fabc',
        );
    });
});

describe('safePatientNext — SC-009', () => {
    it('aceita caminho interno da área do paciente', () => {
        expect(
            safePatientNext('/clinica-cleverton/paciente/programas/abc'),
        ).toBe('/clinica-cleverton/paciente/programas/abc');
        expect(safePatientNext('/paciente/login')).toBe('/paciente/login');
        expect(safePatientNext('/paciente/login?next=%2Fx')).toBe(
            '/paciente/login?next=%2Fx',
        );
    });

    it('rejeita /paciente/programas sem slug — rota SPA inexistente', () => {
        expect(safePatientNext('/paciente/programas')).toBeNull();
    });

    it('rejeita URL absoluta', () => {
        expect(safePatientNext('https://exemplo-externo.com')).toBeNull();
        expect(safePatientNext('http://exemplo-externo.com')).toBeNull();
    });

    it('rejeita protocolo relativo — o caso que quebra a checagem ingênua', () => {
        // O navegador resolve //host como URL absoluta com o protocolo atual.
        expect(safePatientNext('//exemplo-externo.com')).toBeNull();
        expect(
            safePatientNext('//exemplo-externo.com/paciente/programas'),
        ).toBeNull();
    });

    it('rejeita barra invertida usada para burlar a checagem', () => {
        expect(safePatientNext('/\\exemplo-externo.com')).toBeNull();
    });

    it('rejeita caminho fora da área do paciente', () => {
        expect(safePatientNext('/clinica/pacientes')).toBeNull();
        expect(safePatientNext('/admin/dashboard')).toBeNull();
    });

    it('rejeita vazio e nulo', () => {
        expect(safePatientNext('')).toBeNull();
        expect(safePatientNext(null)).toBeNull();
        expect(safePatientNext(undefined)).toBeNull();
    });
});

describe('patientPostLoginPath', () => {
    it('usa o next quando é seguro', () => {
        expect(
            patientPostLoginPath(
                '/clinica-cleverton/paciente/programas/abc',
                'clinica-cleverton',
            ),
        ).toBe('/clinica-cleverton/paciente/programas/abc');
    });

    it('cai na lista de programas quando o next é externo', () => {
        expect(
            patientPostLoginPath('https://site-falso.com', 'clinica-cleverton'),
        ).toBe('/clinica-cleverton/paciente/programas');
    });

    it('cai na lista de programas quando não há next', () => {
        expect(patientPostLoginPath(null, 'clinica-cleverton')).toBe(
            '/clinica-cleverton/paciente/programas',
        );
    });

    it('cai no login quando não há next nem slug da clínica', () => {
        expect(patientPostLoginPath(null, '')).toBe('/paciente/login');
    });
});
