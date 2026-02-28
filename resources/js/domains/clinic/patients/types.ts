import type { Patient, TreatmentPlan } from '@/types';

export type Tab = 'prontuario' | 'programas' | 'monitoramento' | 'registros';

export interface ShowProps {
    patient: Patient & { treatment_plans?: TreatmentPlan[] };
}
