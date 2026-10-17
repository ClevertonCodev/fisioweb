import { DsBadge, type BadgeVariant } from '@/components/ds';
import type { PatientStatus } from '@/domain/clinic/patient';

export const STATUS_OPTIONS: {
    value: PatientStatus;
    label: string;
    variant: BadgeVariant;
}[] = [
    { value: 'em_tratamento', label: 'Em tratamento', variant: 'info' },
    { value: 'em_treinamento', label: 'Em treinamento', variant: 'success' },
    { value: 'em_prevencao', label: 'Em prevenção', variant: 'warning' },
    { value: 'alta', label: 'Alta', variant: 'primary' },
    { value: 'cancelado', label: 'Cancelado', variant: 'default' },
    { value: 'obito', label: 'Óbito', variant: 'danger' },
];

export function statusLabel(status: PatientStatus): string {
    return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
    const option = STATUS_OPTIONS.find((o) => o.value === status);
    return (
        <DsBadge variant={option?.variant ?? 'default'} dot>
            {option?.label ?? status}
        </DsBadge>
    );
}
