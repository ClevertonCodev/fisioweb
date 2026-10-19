import type { ClinicProfileFormValues } from '@/application/clinic/clinic-profile-form';
import { clinicProfileToFormValues } from '@/application/clinic/clinic-profile-form';
import { applyMask, formatCnpj, formatCpf } from '@/components/ds';
import type { ClinicProfile } from '@/domain/clinic/clinic-profile';

export const CLINIC_UFS =
    'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(
        ' ',
    );

export const CLINIC_STATUS_LABEL: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
    '1': { label: 'Ativa', variant: 'success' },
    '0': { label: 'Inativa', variant: 'warning' },
    '-1': { label: 'Bloqueada', variant: 'danger' },
};

export function formatClinicPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    return applyMask(
        digits,
        digits.length > 10 ? '(##) #####-####' : '(##) ####-####',
    );
}

export function presentClinicProfileFormValues(
    profile: ClinicProfile,
): ClinicProfileFormValues {
    const values = clinicProfileToFormValues(profile);
    return {
        ...values,
        document:
            values.typePerson === 'PF'
                ? formatCpf(values.document)
                : formatCnpj(values.document),
        phone: formatClinicPhone(values.phone ?? ''),
        zipCode: applyMask(
            (values.zipCode ?? '').replace(/\D/g, ''),
            '#####-###',
        ),
    };
}

export function clinicPatientProgramLinkPreview(
    host: string,
    slug: string,
): string {
    return `${host}/${slug}/paciente/programas/…`;
}
