import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it, vi } from 'vitest';

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({ user: { id: 1, name: 'Cleverton', role: 'admin' } }),
}));

import type { PatientDetail } from '@/domain/clinic/patient';
import type { PatientRecordData } from '@/pages/clinic/patient/patient-record/data';
import { VariantB } from '@/pages/clinic/patient/patient-record/VariantB';
import { routerFutureFlags } from '@/test/browser-router';

function detail(overrides: Partial<PatientDetail> = {}): PatientDetail {
    return {
        id: '107',
        name: 'QA Completo',
        initial: 'Q',
        professional: 'Cleverton',
        professionalInitial: 'C',
        status: 'em_treinamento',
        diagnosis: 'Lombalgia',
        isActive: true,
        apelido: 'QA Apelido',
        useApelido: true,
        isForeign: false,
        ...overrides,
    };
}

function emptyStats(): PatientRecordData['stats'] {
    return {
        completed: 0,
        noShow: 0,
        attendance: null,
        next: null,
        last: null,
        since: null,
        monthsInCare: null,
        noShowStreak: 0,
        activeProgram: null,
        pending: [],
    };
}

function renderRecord(patient: PatientDetail) {
    const data: PatientRecordData = {
        patient,
        items: [],
        stats: emptyStats(),
        isLoading: false,
        isError: false,
        patientError: false,
        listErrors: {
            evolutions: false,
            assessments: false,
            questionnaires: false,
            files: false,
            appointments: false,
            programs: false,
        },
    };
    return render(
        <MemoryRouter future={routerFutureFlags}>
            <VariantB id={patient.id} data={data} onOpen={() => {}} />
        </MemoryRouter>,
    );
}

describe('prontuário (painel de acompanhamento)', () => {
    it('mostra o apelido no título quando o switch está ligado', () => {
        renderRecord(detail());

        expect(
            screen.getByRole('heading', { name: 'QA Apelido' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'QA Completo' }),
        ).not.toBeInTheDocument();
    });

    it('mostra o nome legal quando o switch está desligado', () => {
        renderRecord(detail({ useApelido: false }));

        expect(
            screen.getByRole('heading', { name: 'QA Completo' }),
        ).toBeInTheDocument();
    });
});
