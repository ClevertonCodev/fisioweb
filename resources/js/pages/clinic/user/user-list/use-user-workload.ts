import { useAppointments } from '@/application/clinic/use-appointments';
import { usePatients } from '@/application/clinic/use-patients';
import { useClinicPrograms } from '@/application/clinic/use-programs';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

/** Primeira página de cada lista: os números são aproximados. */
const PAGE_SIZE = 200;
const DAY = 86_400_000;

function isoDay(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

/** Segunda desta semana até a segunda seguinte (a API filtra starts_at <= to). */
export function weekRange(today: Date) {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return {
        from: isoDay(start),
        to: isoDay(new Date(start.getTime() + 7 * DAY)),
    };
}

/**
 * Carga da pessoa, somada no front com as APIs que a clínica já tem.
 * Pacientes batem pelo nome do profissional, porque a listagem de pacientes
 * não traz o id dele. Contadores no backend estão no DEFERRED.md da feature.
 */
export function useUserWorkload(user: ClinicUserSummary) {
    const patients = usePatients({ perPage: PAGE_SIZE });
    const programs = useClinicPrograms({ page: 1, perPage: PAGE_SIZE });
    const week = useAppointments(weekRange(new Date()));

    return {
        isLoading: patients.isLoading || programs.isLoading || week.isLoading,
        patients: (patients.data?.data ?? []).filter(
            (p) => p.professional === user.name,
        ).length,
        programs: (programs.data?.items ?? []).filter(
            (p) => p.professionalId === user.id,
        ).length,
        weekAppointments: (week.data ?? []).filter(
            (a) => a.clinicUserId === user.id && a.status !== 'cancelled',
        ).length,
    };
}
