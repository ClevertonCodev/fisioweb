/**
 * As funções da clínica como aparecem no cadastro e na edição de usuário:
 * nome, descrição e o que cada uma pode fazer.
 */
import type { ClinicRole } from '@/domain/auth/session';

export const ROLE_META: Record<
    ClinicRole,
    { label: string; plural: string; description: string }
> = {
    admin: {
        label: 'Administrador',
        plural: 'Administradores',
        description:
            'Cuida da clínica, da equipe e de tudo o que um fisioterapeuta faz.',
    },
    physiotherapist: {
        label: 'Fisioterapeuta',
        plural: 'Fisioterapeutas',
        description:
            'Atende: prontuário, evoluções, programas e a própria agenda.',
    },
    secretary: {
        label: 'Secretário(a)',
        plural: 'Secretários(as)',
        description: 'Recepção: agenda de todos e cadastro de pacientes.',
    },
};

/**
 * O que cada função pode fazer, tirado de application/clinic/permissions.ts
 * e da regra da agenda (fisioterapeuta só vê a própria, FR-012).
 */
export const CAPABILITIES: {
    key: string;
    label: string;
    access: Record<ClinicRole, true | false | string>;
}[] = [
    {
        key: 'agenda',
        label: 'Agenda',
        access: {
            admin: 'De todos',
            physiotherapist: 'Só a própria',
            secretary: 'De todos',
        },
    },
    {
        key: 'records',
        label: 'Prontuário e evoluções',
        access: { admin: true, physiotherapist: true, secretary: false },
    },
    {
        key: 'sign',
        label: 'Assinar documentos',
        // Assina quem atende: administrador só com CREFITO.
        access: {
            admin: 'Com CREFITO',
            physiotherapist: true,
            secretary: false,
        },
    },
    {
        key: 'reactivate',
        label: 'Inativar e reativar pacientes',
        access: { admin: true, physiotherapist: false, secretary: true },
    },
    {
        key: 'delete',
        label: 'Excluir registros',
        access: {
            admin: true,
            physiotherapist: 'Só os seus',
            secretary: false,
        },
    },
    {
        key: 'users',
        label: 'Gerenciar a equipe',
        access: { admin: true, physiotherapist: false, secretary: false },
    },
    {
        key: 'clinic',
        label: 'Dados da clínica',
        access: {
            admin: 'Só o mestre edita',
            physiotherapist: false,
            secretary: false,
        },
    },
];
