import { useParams } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';

import { AssessmentNewScreen } from './assessment-new/AssessmentNewScreen';
import { useAssessmentPicker } from './assessment-new/shared';

export default function AssessmentNewPage() {
    const { id = '' } = useParams();
    const p = useAssessmentPicker(id, true);

    return (
        <ClinicLayout>
            <AssessmentNewScreen p={p} patientId={id} />
        </ClinicLayout>
    );
}
