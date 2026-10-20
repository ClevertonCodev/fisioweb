/**
 * PROTÓTIPO (descartável): a equipe da clínica com o que cada um carrega.
 * Veio do protótipo da lista (que virou a tela real em user-list/) e fica
 * aqui só enquanto o protótipo da edição existir.
 * Usuários reais (/clinic/users); a carga vem de dados que a clínica já
 * tem: programas (professionalId), consultas da semana (clinicUserId) e
 * pacientes (pelo nome do profissional, porque a entidade Patient só traz
 * o nome). Na tela de verdade, a API de usuários devolveria os números.
 */
import { useAppointments } from '@/application/clinic/use-appointments';
import { useClinicUsers } from '@/application/clinic/use-clinic-users';
import { usePatients } from '@/application/clinic/use-patients';
import { useClinicPrograms } from '@/application/clinic/use-programs';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import type { UserLoad } from '@/pages/clinic/user/user-form/parts';

// ---------------------------------------------------------------- funções

export { CAPABILITIES, ROLE_META } from '@/pages/clinic/user/user-form/roles';

// ---------------------------------------------------------------- equipe

export interface Member extends ClinicUserSummary, UserLoad {
    active: boolean;
}

const DAY = 86_400_000;

function startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function isoDay(d: Date): string {
    const x = startOfDay(d);
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${x.getFullYear()}-${m}-${day}`;
}

function weekRange(today: Date) {
    const start = startOfDay(today);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // segunda
    // A API filtra starts_at <= to: o fim é a meia-noite de depois.
    return {
        from: isoDay(start),
        to: isoDay(new Date(start.getTime() + 7 * DAY)),
    };
}

export function useTeam() {
    const users = useClinicUsers();
    const programs = useClinicPrograms({ page: 1, perPage: 200 });
    const patients = usePatients({ perPage: 200 });
    const week = useAppointments(weekRange(new Date()));

    const members: Member[] = (users.data ?? []).map((u) => ({
        ...u,
        active: Boolean(u.status),
        patients: (patients.data?.data ?? []).filter(
            (p) => p.professional === u.name,
        ).length,
        programs: (programs.data?.items ?? []).filter(
            (p) => p.professionalId === u.id,
        ).length,
        weekAppointments: (week.data ?? []).filter(
            (a) => a.clinicUserId === u.id && a.status !== 'cancelled',
        ).length,
    }));
    // Mestre primeiro, depois por nome.
    members.sort(
        (a, b) => b.mestre - a.mestre || a.name.localeCompare(b.name, 'pt-BR'),
    );
    return { members, isLoading: users.isLoading, isError: users.isError };
}
