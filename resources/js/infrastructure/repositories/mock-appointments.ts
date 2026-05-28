import { addDays, startOfWeek } from 'date-fns';

import type { AppointmentsRepository } from '@/application/clinic/ports';
import type { Appointment } from '@/domain/clinic';

const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

function makeDate(dayOffset: number, hour: number, min = 0) {
    const d = addDays(weekStart, dayOffset);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
}

const mockClinicUsers = [
    { id: '1', name: 'Dra. Maria Silva' },
    { id: '2', name: 'Dr. João Santos' },
    { id: '3', name: 'Dra. Ana Oliveira' },
];

const mockAgendaPatients = [
    { id: '1', name: 'Carlos Mendes' },
    { id: '2', name: 'Beatriz Ferreira' },
    { id: '3', name: 'Rafael Costa' },
    { id: '4', name: 'Juliana Almeida' },
    { id: '5', name: 'Pedro Souza' },
    { id: '6', name: 'Mariana Lima' },
];

const mockAppointments: Appointment[] = [
    {
        id: '1',
        patientId: '1',
        patientName: 'Carlos Mendes',
        clinicUserId: '1',
        clinicUserName: 'Dra. Maria Silva',
        title: 'Avaliação inicial',
        description: 'Primeira consulta',
        startsAt: makeDate(0, 8),
        endsAt: makeDate(0, 9),
        status: 'confirmed',
        location: 'Sala 1',
        sendCalendarInvite: false,
    },
    {
        id: '2',
        patientId: '2',
        patientName: 'Beatriz Ferreira',
        clinicUserId: '1',
        clinicUserName: 'Dra. Maria Silva',
        title: 'Sessão de RPG',
        description: null,
        startsAt: makeDate(0, 10),
        endsAt: makeDate(0, 11),
        status: 'scheduled',
        location: 'Sala 2',
        sendCalendarInvite: true,
    },
    {
        id: '3',
        patientId: '3',
        patientName: 'Rafael Costa',
        clinicUserId: '2',
        clinicUserName: 'Dr. João Santos',
        title: 'Pilates clínico',
        description: 'Foco em lombar',
        startsAt: makeDate(1, 9),
        endsAt: makeDate(1, 10),
        status: 'scheduled',
        location: 'Sala 3',
        sendCalendarInvite: false,
    },
    {
        id: '4',
        patientId: '4',
        patientName: 'Juliana Almeida',
        clinicUserId: '2',
        clinicUserName: 'Dr. João Santos',
        title: 'Retorno',
        description: null,
        startsAt: makeDate(1, 14),
        endsAt: makeDate(1, 15),
        status: 'confirmed',
        location: null,
        sendCalendarInvite: false,
    },
    {
        id: '5',
        patientId: '5',
        patientName: 'Pedro Souza',
        clinicUserId: '3',
        clinicUserName: 'Dra. Ana Oliveira',
        title: null,
        description: null,
        startsAt: makeDate(2, 8),
        endsAt: makeDate(2, 9),
        status: 'completed',
        location: 'Sala 1',
        sendCalendarInvite: false,
    },
    {
        id: '6',
        patientId: '6',
        patientName: 'Mariana Lima',
        clinicUserId: '1',
        clinicUserName: 'Dra. Maria Silva',
        title: 'Sessão de fisioterapia',
        description: null,
        startsAt: makeDate(2, 11),
        endsAt: makeDate(2, 12),
        status: 'no_show',
        location: 'Sala 2',
        sendCalendarInvite: true,
    },
    {
        id: '7',
        patientId: '1',
        patientName: 'Carlos Mendes',
        clinicUserId: '3',
        clinicUserName: 'Dra. Ana Oliveira',
        title: 'Sessão cancelada',
        description: 'Paciente solicitou cancelamento',
        startsAt: makeDate(3, 15),
        endsAt: makeDate(3, 16),
        status: 'cancelled',
        location: null,
        sendCalendarInvite: false,
    },
    {
        id: '8',
        patientId: '2',
        patientName: 'Beatriz Ferreira',
        clinicUserId: '2',
        clinicUserName: 'Dr. João Santos',
        title: 'Avaliação postural',
        description: null,
        startsAt: makeDate(3, 10),
        endsAt: makeDate(3, 11, 30),
        status: 'scheduled',
        location: 'Sala 1',
        sendCalendarInvite: false,
    },
    {
        id: '9',
        patientId: '4',
        patientName: 'Juliana Almeida',
        clinicUserId: '1',
        clinicUserName: 'Dra. Maria Silva',
        title: 'Fortalecimento',
        description: null,
        startsAt: makeDate(4, 9),
        endsAt: makeDate(4, 10),
        status: 'confirmed',
        location: 'Sala 3',
        sendCalendarInvite: true,
    },
    {
        id: '10',
        patientId: '3',
        patientName: 'Rafael Costa',
        clinicUserId: '3',
        clinicUserName: 'Dra. Ana Oliveira',
        title: 'Exercícios terapêuticos',
        description: null,
        startsAt: makeDate(4, 14),
        endsAt: makeDate(4, 15),
        status: 'scheduled',
        location: 'Sala 2',
        sendCalendarInvite: false,
    },
];

export const mockAppointmentsRepository: AppointmentsRepository = {
    async list() {
        return [...mockAppointments];
    },
    async getClinicUsers() {
        return [...mockClinicUsers];
    },
    async getAgendaPatients() {
        return [...mockAgendaPatients];
    },
};

export { mockAgendaPatients, mockAppointments, mockClinicUsers };
