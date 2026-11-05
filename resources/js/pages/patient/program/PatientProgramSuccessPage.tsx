import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { patientProgramsListPath } from '@/application/patient/patient-program-paths';
import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';

import {
    ORIGINAL_NAME,
    Original,
} from './program-success-prototype/Original';
import {
    VARIANT_A_NAME,
    VariantA,
} from './program-success-prototype/VariantA';
import type { ProgramSuccessViewProps } from './program-success-prototype/shared';

const PROTOTYPE_VARIANTS = [
    { key: 'original', label: ORIGINAL_NAME },
    { key: 'A', label: VARIANT_A_NAME },
];

export default function PatientProgramSuccessPage() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const [searchParams] = useSearchParams();
    const variant = searchParams.get('variant') ?? 'original';
    const navigate = useNavigate();

    const onBackToPrograms = () => {
        navigate(clinicSlug ? patientProgramsListPath(clinicSlug) : '/');
    };

    const viewProps: ProgramSuccessViewProps = {
        clinicSlug,
        onBackToPrograms,
    };

    return (
        <>
            {variant === 'A' ? (
                <VariantA {...viewProps} />
            ) : (
                <Original {...viewProps} />
            )}
            <PrototypeSwitcher
                variants={PROTOTYPE_VARIANTS}
                current={variant === 'A' ? 'A' : 'original'}
            />
        </>
    );
}
