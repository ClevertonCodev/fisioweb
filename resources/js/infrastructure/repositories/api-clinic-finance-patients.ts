import type {
    FinancePatientAppointment,
    TransactionPatient,
} from '@/domain/clinic/finance';
import { apiClient } from '@/infrastructure/api/client';

interface ApiPatientOption {
    id: number;
    name: string;
}

interface ApiPatientAppointment {
    id: number;
    starts_at: string;
    title: string | null;
}

/** Seletores de paciente e atendimento do lançamento de entrada (Finanças). */
export const apiClinicFinancePatientsRepository = {
    async search(q: string): Promise<TransactionPatient[]> {
        const res = await apiClient.get<{ data: ApiPatientOption[] }>(
            '/clinic/finances/patients',
            { params: { q } },
        );
        return res.data.data.map((p) => ({ id: String(p.id), name: p.name }));
    },

    async appointments(
        patientId: string,
    ): Promise<FinancePatientAppointment[]> {
        const res = await apiClient.get<{ data: ApiPatientAppointment[] }>(
            `/clinic/finances/patients/${patientId}/appointments`,
        );
        return res.data.data.map((a) => ({
            id: String(a.id),
            startsAt: a.starts_at,
            title: a.title,
        }));
    },
};
