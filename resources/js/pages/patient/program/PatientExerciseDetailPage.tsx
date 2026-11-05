import { useSearchParams } from 'react-router-dom';

import { PrototypeSwitcher } from '@/components/dev/PrototypeSwitcher';

import PatientExerciseDetailPageV1 from './PatientExerciseDetailPageV1';
import PatientExerciseDetailPageV2B from './PatientExerciseDetailPageV2B';

const EXERCISE_DETAIL_VARIANTS = [
    { key: 'O', label: 'Original (v1)' },
    { key: 'B', label: 'Split estúdio (DS)' },
];

export default function PatientExerciseDetailPage() {
    const [searchParams] = useSearchParams();
    const variantKey = searchParams.get('variant')?.toUpperCase() ?? 'O';
    const showV2B = variantKey === 'B';

    return (
        <>
            {showV2B ? (
                <PatientExerciseDetailPageV2B />
            ) : (
                <PatientExerciseDetailPageV1 />
            )}
            <PrototypeSwitcher
                variants={EXERCISE_DETAIL_VARIANTS}
                current={showV2B ? 'B' : 'O'}
            />
        </>
    );
}
