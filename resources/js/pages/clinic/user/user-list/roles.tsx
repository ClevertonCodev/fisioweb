import { Headset, ShieldCheck, Stethoscope } from 'lucide-react';
import type { ReactNode } from 'react';

import { can } from '@/application/clinic/permissions';
import { CLINIC_ROLES } from '@/application/clinic/user-list-filters';
import type { ClinicRole } from '@/domain/auth/session';

export const ROLES = CLINIC_ROLES;

export const ROLE_META: Record<
    ClinicRole,
    { label: string; description: string; icon: ReactNode; tone: string }
> = {
    admin: {
        label: 'Administrador',
        description:
            'Cuida da clínica, da equipe e de tudo o que um fisioterapeuta faz.',
        icon: <ShieldCheck />,
        tone: 'bg-ds-primary-80 text-ds-content-on-brand ds-dark:bg-ds-primary-70',
    },
    physiotherapist: {
        label: 'Fisioterapeuta',
        description:
            'Atende: prontuário, evoluções, programas e a própria agenda.',
        icon: <Stethoscope />,
        // Ícone escuro: branco sobre o verde-80 fica abaixo de 3:1.
        tone: 'bg-ds-success-80 text-ds-success-120',
    },
    secretary: {
        label: 'Secretário(a)',
        description: 'Recepção: agenda de todos e cadastro de pacientes.',
        icon: <Headset />,
        tone: 'bg-ds-warning-50 text-ds-warning-120',
    },
};

/** `true` pode, `false` não pode, texto = pode com ressalva. */
export type Access = boolean | string;

/**
 * O que cada função pode fazer, tirado de `permissions.ts` e da regra da
 * agenda (fisioterapeuta só vê a própria, FR-012). Texto de produto: quem
 * decide de verdade é a API.
 */
export const CAPABILITIES: {
    key: string;
    label: string;
    access: (role: ClinicRole) => Access;
}[] = [
    {
        key: 'agenda',
        label: 'Agenda',
        access: (r) => (r === 'physiotherapist' ? 'Só a própria' : 'De todos'),
    },
    {
        key: 'records',
        label: 'Prontuário e evoluções',
        access: (r) => can.manageClinicalRecords(r),
    },
    {
        key: 'sign',
        label: 'Assinar documentos',
        // Como as Policies de assinatura (AssessmentPolicy, PatientEvolutionPolicy):
        // o fisioterapeuta assina os próprios registros; o admin, qualquer um.
        access: (r) =>
            can.sign(r) ? (r === 'admin' ? true : 'Só os seus') : false,
    },
    {
        key: 'reactivate',
        label: 'Inativar e reativar pacientes',
        access: (r) => can.reactivate(r),
    },
    {
        key: 'delete',
        label: 'Excluir registros',
        access: (r) =>
            can.delete(r) ? true : can.deleteOwn(r) ? 'Só os seus' : false,
    },
    {
        key: 'users',
        label: 'Gerenciar a equipe',
        access: (r) => can.manageUsers(r),
    },
    {
        key: 'clinic',
        label: 'Dados da clínica',
        access: (r) => (can.manageClinicData(r) ? 'Só o mestre edita' : false),
    },
];

export function accessLabel(value: Access): string {
    return value === true ? 'Sim' : value === false ? 'Não' : value;
}

/**
 * Nível de um acesso, para dizer se a troca ganha ou perde: não pode (0),
 * pode com ressalva (1: "Só a própria", "Só os seus"...) e
 * pode tudo (2). "De todos" é o máximo da agenda.
 */
function accessLevel(value: Access): number {
    if (value === false) return 0;
    if (value === true || value === 'De todos') return 2;
    return 1;
}

/** O que muda ao trocar de função: só as linhas diferentes. */
export function capabilityDiff(from: ClinicRole, to: ClinicRole) {
    return CAPABILITIES.map((c) => {
        const before = c.access(from);
        const after = c.access(to);
        return {
            key: c.key,
            label: c.label,
            before,
            after,
            change:
                accessLevel(after) > accessLevel(before)
                    ? ('gain' as const)
                    : ('loss' as const),
        };
    }).filter((c) => c.before !== c.after);
}
