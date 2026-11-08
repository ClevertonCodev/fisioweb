import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    clearStoredAuth,
    getStoredAuth,
    getStoredAuthForPage,
    replaceStoredToken,
    setSessionAuth,
    setStoredAuth,
} from '@/infrastructure/api/client';

describe('replaceStoredToken', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('troca o token salvo do guard', () => {
        setStoredAuth('token-antigo', 'clinic');
        setStoredAuth('token-admin', 'admin');

        replaceStoredToken('token-novo', 'clinic');

        expect(getStoredAuth('clinic')).toEqual({
            token: 'token-novo',
            guard: 'clinic',
        });
        expect(getStoredAuth('admin')?.token).toBe('token-admin');
    });

    it('na aba do "entrar como", troca só o token da aba', () => {
        setStoredAuth('token-da-clinica', 'clinic');
        setSessionAuth('token-da-aba', 'clinic');

        replaceStoredToken('token-novo', 'clinic');

        expect(sessionStorage.getItem('auth_token')).toBe('token-novo');
        expect(localStorage.getItem('auth_token_clinic')).toBe(
            'token-da-clinica',
        );
    });
});

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
