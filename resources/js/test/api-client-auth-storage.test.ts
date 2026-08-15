import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearStoredAuth,
    getStoredAuth,
    getStoredAuthForPage,
    setStoredAuth,
} from '@/infrastructure/api/client';

describe('getStoredAuth — inferência por rota', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('prioriza paciente em /{slug}/paciente/... mesmo começando com /clinica', () => {
        vi.stubGlobal('location', {
            pathname: '/clinica-cleverton/paciente/programas',
        });

        setStoredAuth('patient-token', 'patient');
        setStoredAuth('clinic-token', 'clinic');

        expect(getStoredAuth()).toEqual({
            token: 'patient-token',
            guard: 'patient',
        });
    });

    it('getStoredAuthForPage força paciente na área do paciente', () => {
        vi.stubGlobal('location', {
            pathname: '/clinica-cleverton/paciente/programas',
        });

        setStoredAuth('patient-token', 'patient');
        setStoredAuth('clinic-token', 'clinic');

        expect(getStoredAuthForPage()).toEqual({
            token: 'patient-token',
            guard: 'patient',
        });
    });

    it('usa clínica em /clinica/...', () => {
        vi.stubGlobal('location', {
            pathname: '/clinica/pacientes',
        });

        setStoredAuth('patient-token', 'patient');
        setStoredAuth('clinic-token', 'clinic');

        expect(getStoredAuth()).toEqual({
            token: 'clinic-token',
            guard: 'clinic',
        });
    });

    it('usa paciente em /paciente/login', () => {
        vi.stubGlobal('location', {
            pathname: '/paciente/login',
        });

        setStoredAuth('patient-token', 'patient');

        expect(getStoredAuth()).toEqual({
            token: 'patient-token',
            guard: 'patient',
        });
    });
});

describe('clearStoredAuth', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('limpa só o guard informado', () => {
        setStoredAuth('patient-token', 'patient');
        setStoredAuth('clinic-token', 'clinic');

        clearStoredAuth('patient');

        expect(getStoredAuth('patient')).toBeNull();
        expect(getStoredAuth('clinic')).toEqual({
            token: 'clinic-token',
            guard: 'clinic',
        });
    });
});
