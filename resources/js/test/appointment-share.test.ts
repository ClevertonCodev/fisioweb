import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appointmentScheduledWhatsAppUrl } from '@/application/clinic/appointment-share';
import type { Appointment } from '@/domain/clinic';

function inDays(days: number, hour: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date;
}

function appointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: '7',
        patientId: '3',
        patientName: 'João Pereira',
        patientEmail: 'joao@example.test',
        patientPhone: '(11) 98888-7777',
        clinicUserId: '5',
        clinicUserName: 'Rafael Lima',
        title: 'Avaliação',
        description: null,
        startsAt: inDays(3, 14).toISOString(),
        endsAt: inDays(3, 15).toISOString(),
        status: 'scheduled',
        location: null,
        source: 'system',
        ...overrides,
    };
}

function decodedText(url: string | null): string {
    expect(url).not.toBeNull();
    return new URL(url as string).searchParams.get('text') ?? '';
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 23, 9, 0));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('appointmentScheduledWhatsAppUrl', () => {
    it('abre o wa.me com o código do Brasil e o texto com data, horário e profissional', () => {
        const url = appointmentScheduledWhatsAppUrl(appointment());

        expect(url?.startsWith('https://wa.me/5511988887777?text=')).toBe(true);
        const text = decodedText(url);
        expect(text).toContain('Olá, João!');
        expect(text).toContain('quinta-feira, 26/11');
        expect(text).toContain('às 14:00');
        expect(text).toContain('Rafael Lima');
    });

    it('número que já vem com o 55 não ganha outro', () => {
        const url = appointmentScheduledWhatsAppUrl(
            appointment({ patientPhone: '+55 (11) 98888-7777' }),
        );

        expect(url?.startsWith('https://wa.me/5511988887777?text=')).toBe(true);
    });

    it('fixo de 10 dígitos também ganha o 55', () => {
        const url = appointmentScheduledWhatsAppUrl(
            appointment({ patientPhone: '(11) 4000-1234' }),
        );

        expect(url?.startsWith('https://wa.me/551140001234?text=')).toBe(true);
    });

    it('zero de tronco na frente sai e o número ganha o 55', () => {
        const url = appointmentScheduledWhatsAppUrl(
            appointment({ patientPhone: '011 98888-7777' }),
        );

        expect(url?.startsWith('https://wa.me/5511988887777?text=')).toBe(true);
    });

    it('número sem DDD não monta o link', () => {
        expect(
            appointmentScheduledWhatsAppUrl(
                appointment({ patientPhone: '98888-7777' }),
            ),
        ).toBeNull();
    });

    it('sem celular não monta o link', () => {
        expect(
            appointmentScheduledWhatsAppUrl(
                appointment({ patientPhone: null }),
            ),
        ).toBeNull();
    });

    it('sem profissional não cita o nome', () => {
        const text = decodedText(
            appointmentScheduledWhatsAppUrl(
                appointment({ clinicUserName: '' }),
            ),
        );
        expect(text).not.toContain(' com ');
    });
});
