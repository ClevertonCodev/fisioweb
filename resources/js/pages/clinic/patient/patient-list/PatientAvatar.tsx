import { useRefreshList } from '@/application/clinic/use-refresh-list';
import { ProtectedImage } from '@/components/protected-media/ProtectedImage';
import type { Patient } from '@/domain/clinic/patient';

export function PatientAvatar({
    patient,
    size = 44,
}: {
    patient: Pick<Patient, 'id' | 'name' | 'initial' | 'photoUrl'>;
    size?: number;
}) {
    const refreshPhoto = useRefreshList('patients');
    return (
        <span
            aria-hidden="true"
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.38),
            }}
        >
            {patient.photoUrl ? (
                <ProtectedImage
                    src={patient.photoUrl}
                    alt=""
                    onRefresh={refreshPhoto}
                    className="size-full object-cover"
                />
            ) : (
                patient.initial
            )}
        </span>
    );
}
