import { describe, expect, it } from 'vitest';

import {
    patientAppointmentsWindow,
    patientCareStats,
} from '@/application/clinic/patient-care';
import type { Appointment, Program } from '@/domain/clinic';

const NOW = new Date('2026-10-22T12:00:00');

let seq = 0;

function appointment(
    startsAt: string,
    status: Appointment['status'],
): Appointment {
    seq += 1;
    return {
        id: String(seq),
        patientId: '3',
        patientName: 'Paciente Teste',
        clinicUserId: '5',
        clinicUserName: 'Profissional Teste',
        title: null,
        description: null,
        startsAt,
        endsAt: startsAt,
        status,
        location: null,
        source: 'system',
    };
}

function program(
    id: string,
    startDate: string,
    status: Program['status'],
): Program {
    return {
        id,
        title: `Programa ${id}`,
        patientId: '3',
        patientName: 'Paciente Teste',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '5',
        professionalName: 'Profissional Teste',
        professionalPhotoUrl: null,
        exerciseCount: 3,
        startDate,
        endDate: null,
        message: '',
        groups: [],
        status,
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: startDate,
    };
}

describe('patientCareStats', () => {
    it('lista vazia: sem números nem datas', () => {
        expect(patientCareStats([], [], NOW)).toEqual({
            completed: 0,
            noShow: 0,
            attendance: null,
            noShowStreak: 0,
            next: null,
            last: null,
            since: null,
            monthsInCare: null,
            activeProgram: null,
        });
    });

    it('só canceladas: não contam comparecimento, próxima nem início', () => {
        const stats = patientCareStats(
            [
                appointment('2026-09-01T10:00:00', 'cancelled'),
                appointment('2026-11-01T10:00:00', 'cancelled'),
            ],
            [],
            NOW,
        );

        expect(stats.completed).toBe(0);
        expect(stats.noShow).toBe(0);
        expect(stats.attendance).toBeNull();
        expect(stats.next).toBeNull();
        expect(stats.last).toBeNull();
        expect(stats.since).toBeNull();
        expect(stats.monthsInCare).toBeNull();
    });

    it('comparecimento usa só as consultas encerradas', () => {
        const stats = patientCareStats(
            [
                appointment('2026-07-01T10:00:00', 'completed'),
                appointment('2026-08-01T10:00:00', 'completed'),
                appointment('2026-09-01T10:00:00', 'completed'),
                appointment('2026-09-15T10:00:00', 'no_show'),
                appointment('2026-10-01T10:00:00', 'cancelled'),
                appointment('2026-11-01T10:00:00', 'scheduled'),
            ],
            [],
            NOW,
        );

        expect(stats.completed).toBe(3);
        expect(stats.noShow).toBe(1);
        expect(stats.attendance).toBe(75);
    });

    it('faltas seguidas contam da mais recente até a primeira presença', () => {
        const stats = patientCareStats(
            [
                appointment('2026-10-15T10:00:00', 'no_show'),
                appointment('2026-07-01T10:00:00', 'no_show'),
                appointment('2026-10-01T10:00:00', 'no_show'),
                appointment('2026-08-01T10:00:00', 'completed'),
                appointment('2026-10-10T10:00:00', 'cancelled'),
            ],
            [],
            NOW,
        );

        expect(stats.noShowStreak).toBe(2);
        expect(stats.noShow).toBe(3);
    });

    it('sem falta recente, a sequência é zero', () => {
        const stats = patientCareStats(
            [
                appointment('2026-09-01T10:00:00', 'no_show'),
                appointment('2026-10-01T10:00:00', 'completed'),
            ],
            [],
            NOW,
        );

        expect(stats.noShowStreak).toBe(0);
    });

    it('próxima é a futura mais cedo não cancelada; última é a realizada mais recente', () => {
        const nextOne = appointment('2026-10-25T09:00:00', 'confirmed');
        const lastOne = appointment('2026-10-20T09:00:00', 'completed');
        const stats = patientCareStats(
            [
                appointment('2026-12-01T09:00:00', 'scheduled'),
                appointment('2026-10-23T09:00:00', 'cancelled'),
                nextOne,
                appointment('2026-09-20T09:00:00', 'completed'),
                appointment('2026-10-21T09:00:00', 'no_show'),
                lastOne,
            ],
            [],
            NOW,
        );

        expect(stats.next?.id).toBe(nextOne.id);
        expect(stats.last?.id).toBe(lastOne.id);
    });

    it('tempo de acompanhamento parte da primeira consulta ou programa já começado', () => {
        const stats = patientCareStats(
            [
                appointment('2026-07-22T10:00:00', 'completed'),
                appointment('2026-01-10T10:00:00', 'cancelled'),
            ],
            [
                program('1', '2026-04-22', 'completed'),
                program('2', '2027-01-01', 'draft'),
            ],
            NOW,
        );

        expect(stats.since).toEqual(new Date('2026-04-22'));
        expect(stats.monthsInCare).toBe(6);
    });

    it('acompanhamento recém-começado conta como 1 mês', () => {
        const stats = patientCareStats(
            [appointment('2026-10-20T10:00:00', 'completed')],
            [],
            NOW,
        );

        expect(stats.monthsInCare).toBe(1);
    });

    it('programa ativo é o ativo ou enviado mais recente', () => {
        const stats = patientCareStats(
            [],
            [
                program('1', '2026-03-01', 'active'),
                program('2', '2026-09-01', 'sent'),
                program('3', '2026-10-01', 'draft'),
                program('4', '2026-10-10', 'completed'),
            ],
            NOW,
        );

        expect(stats.activeProgram?.id).toBe('2');
    });

    it('sem programa ativo ou enviado, não há programa ativo', () => {
        const stats = patientCareStats(
            [],
            [
                program('1', '2026-03-01', 'draft'),
                program('2', '2026-09-01', 'completed'),
            ],
            NOW,
        );

        expect(stats.activeProgram).toBeNull();
    });
});

describe('patientAppointmentsWindow', () => {
    it('12 meses para trás e 6 para frente, com o to no dia seguinte ao último', () => {
        expect(patientAppointmentsWindow(NOW)).toEqual({
            from: '2025-10-22',
            to: '2027-04-23',
        });
    });

    it('é a mesma ao longo do dia (chave da query estável)', () => {
        expect(
            patientAppointmentsWindow(new Date('2026-10-22T00:01:00')),
        ).toEqual(patientAppointmentsWindow(new Date('2026-10-22T23:59:00')));
    });
});
