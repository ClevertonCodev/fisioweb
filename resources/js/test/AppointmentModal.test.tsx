import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppointmentModal } from '@/components/clinic/agenda/AppointmentModal';
import type { Appointment } from '@/domain/clinic';

const patients = [
    { id: '102', name: 'Paciente Teste Bug CPF' },
    { id: '10', name: 'Outro Paciente' },
];

const clinicUsers = [{ id: '5', name: 'Cleverton' }];

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
    return {
        id: '77',
        patientId: '102',
        patientName: 'Paciente Teste Bug CPF',
        clinicUserId: '5',
        clinicUserName: 'Cleverton',
        title: 'QA Agenda',
        description: null,
        startsAt: '2026-12-20T13:00:00.000Z',
        endsAt: '2026-12-20T14:00:00.000Z',
        status: 'scheduled',
        location: null,
        source: 'system',
        ...overrides,
    };
}

describe('AppointmentModal', () => {
    it('pré-seleciona paciente via initialPatientId em Nova Consulta', async () => {
        render(
            <AppointmentModal
                open
                onClose={() => {}}
                appointment={null}
                initialDate={new Date('2026-12-20T13:00:00')}
                initialPatientId="102"
                patients={patients}
                clinicUsers={clinicUsers}
                onSubmit={async () => {}}
            />,
        );

        await waitFor(() => {
            expect(
                screen.getByRole('combobox', { name: /paciente/i }),
            ).toHaveTextContent('Paciente Teste Bug CPF');
        });
    });

    it('não reseta campos do form quando só o status da mesma consulta muda', async () => {
        const user = userEvent.setup();
        const appointment = makeAppointment({ status: 'scheduled' });

        const { rerender } = render(
            <AppointmentModal
                open
                onClose={() => {}}
                appointment={appointment}
                initialDate={null}
                patients={patients}
                clinicUsers={clinicUsers}
                onSubmit={async () => {}}
                onStatusChange={async () => {}}
            />,
        );

        const titleInput =
            await screen.findByPlaceholderText(/avaliação inicial/i);
        await user.clear(titleInput);
        await user.type(titleInput, 'Título sujo QA');

        rerender(
            <AppointmentModal
                open
                onClose={() => {}}
                appointment={{ ...appointment, status: 'confirmed' }}
                initialDate={null}
                patients={patients}
                clinicUsers={clinicUsers}
                onSubmit={async () => {}}
                onStatusChange={async () => {}}
            />,
        );

        expect(screen.getByDisplayValue('Título sujo QA')).toBeInTheDocument();
    });
});
