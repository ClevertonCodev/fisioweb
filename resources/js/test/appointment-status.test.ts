import { describe, expect, it } from 'vitest';

import {
    canTransitionAppointmentStatus,
    isTerminalAppointmentStatus,
    selectableAppointmentStatuses,
} from '@/domain/clinic/appointment';

describe('canTransitionAppointmentStatus', () => {
    const startsAt = '2026-06-20T13:00:00.000Z';
    const beforeStart = new Date('2026-06-20T12:00:00.000Z');
    const afterStart = new Date('2026-06-20T14:00:00.000Z');

    it('permite scheduled → confirmed/cancelled antes do horário', () => {
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'confirmed',
                startsAt,
                beforeStart,
            ),
        ).toBe(true);
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'cancelled',
                startsAt,
                beforeStart,
            ),
        ).toBe(true);
    });

    it('bloqueia completed/no_show antes do horário de início', () => {
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'completed',
                startsAt,
                beforeStart,
            ),
        ).toBe(false);
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'no_show',
                startsAt,
                beforeStart,
            ),
        ).toBe(false);
    });

    it('permite completed/no_show depois do horário de início', () => {
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'completed',
                startsAt,
                afterStart,
            ),
        ).toBe(true);
        expect(
            canTransitionAppointmentStatus(
                'confirmed',
                'no_show',
                startsAt,
                afterStart,
            ),
        ).toBe(true);
    });

    it('não permite transição a partir de status terminal', () => {
        expect(
            canTransitionAppointmentStatus(
                'cancelled',
                'scheduled',
                startsAt,
                afterStart,
            ),
        ).toBe(false);
        expect(
            canTransitionAppointmentStatus(
                'completed',
                'confirmed',
                startsAt,
                afterStart,
            ),
        ).toBe(false);
        expect(
            canTransitionAppointmentStatus(
                'no_show',
                'scheduled',
                startsAt,
                afterStart,
            ),
        ).toBe(false);
    });

    it('não permite transição para o mesmo status', () => {
        expect(
            canTransitionAppointmentStatus(
                'scheduled',
                'scheduled',
                startsAt,
                afterStart,
            ),
        ).toBe(false);
    });

    it('confirmed não volta para scheduled', () => {
        expect(
            canTransitionAppointmentStatus(
                'confirmed',
                'scheduled',
                startsAt,
                beforeStart,
            ),
        ).toBe(false);
    });
});

describe('isTerminalAppointmentStatus', () => {
    it('marca cancelled, completed e no_show como terminais', () => {
        expect(isTerminalAppointmentStatus('cancelled')).toBe(true);
        expect(isTerminalAppointmentStatus('completed')).toBe(true);
        expect(isTerminalAppointmentStatus('no_show')).toBe(true);
        expect(isTerminalAppointmentStatus('scheduled')).toBe(false);
        expect(isTerminalAppointmentStatus('confirmed')).toBe(false);
    });
});

describe('selectableAppointmentStatuses', () => {
    const startsAt = '2026-12-20T13:00:00.000Z';
    const beforeStart = new Date('2026-07-18T12:00:00.000Z');

    it('em scheduled antes do horário omite completed e no_show', () => {
        expect(
            selectableAppointmentStatuses('scheduled', startsAt, beforeStart),
        ).toEqual(['scheduled', 'confirmed', 'cancelled']);
    });

    it('em confirmed antes do horário só permite cancelar', () => {
        expect(
            selectableAppointmentStatuses('confirmed', startsAt, beforeStart),
        ).toEqual(['confirmed', 'cancelled']);
    });
});
