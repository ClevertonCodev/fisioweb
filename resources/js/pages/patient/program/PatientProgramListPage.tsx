import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { patientProgramDetailPath } from '@/application/patient/patient-program-paths';
import { usePatientPrograms } from '@/application/patient/use-patient-program';

import PatientProgramListPageV1 from './PatientProgramListPageV1';
import { VariantC } from './program-list-prototype/VariantC';
import type { ProgramListViewProps } from './program-list-prototype/shared';

function PatientProgramListPrototypeC() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const navigate = useNavigate();

    const { data: programs, isLoading, refetch, isRefetching } =
        usePatientPrograms();

    const viewProps: ProgramListViewProps = {
        clinicSlug,
        programs,
        isLoading,
        isRefetching,
        onRefresh: () => {
            void refetch();
        },
        onOpenProgram: (publicToken) => {
            const program = programs?.find(
                (p) => p.publicToken === publicToken,
            );
            const slug = clinicSlug || program?.clinicSlug || '';
            if (!slug) return;
            navigate(patientProgramDetailPath(slug, publicToken));
        },
    };

    return <VariantC {...viewProps} />;
}

export default function PatientProgramListPage() {
    const [searchParams] = useSearchParams();
    const showPrototypeC =
        searchParams.get('variant')?.toUpperCase() === 'C';

    if (!showPrototypeC) {
        return <PatientProgramListPageV1 />;
    }

    return <PatientProgramListPrototypeC />;
}
