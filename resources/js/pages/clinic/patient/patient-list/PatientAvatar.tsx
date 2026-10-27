import type { Patient } from '@/domain/clinic/patient';

export function PatientAvatar({
    patient,
    size = 44,
}: {
    patient: Pick<Patient, 'name' | 'initial' | 'photoUrl'>;
    size?: number;
}) {
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
                <img
                    src={patient.photoUrl}
                    alt=""
                    className="size-full object-cover"
                />
            ) : (
                patient.initial
            )}
        </span>
    );
}
