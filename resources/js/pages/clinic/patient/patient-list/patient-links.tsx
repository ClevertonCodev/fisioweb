import { Calendar, Dumbbell, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';

import type { Patient } from '@/domain/clinic/patient';

export function patientRecordPath(patient: Patient): string {
    return `/clinica/pacientes/${patient.id}`;
}

/** Atalhos do rodapé do cartão: os mesmos destinos do menu da tela v1. */
export const PATIENT_SHORTCUTS: {
    key: string;
    label: string;
    icon: ReactNode;
    path: (patient: Patient) => string;
}[] = [
    {
        key: 'programas',
        label: 'Programas',
        icon: <Dumbbell />,
        path: (p) =>
            `/clinica/programas/historico?patientId=${p.id}&search=${encodeURIComponent(p.name)}`,
    },
    {
        key: 'agenda',
        label: 'Agendamentos',
        icon: <Calendar />,
        path: (p) => `/clinica/agenda?patientId=${p.id}`,
    },
    {
        key: 'editar',
        label: 'Editar perfil',
        icon: <Pencil />,
        path: (p) => `/clinica/pacientes/${p.id}/editar`,
    },
];
