import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';

import { AssessmentEditScreen } from './assessment-form/AssessmentEditScreen';
import { useAssessmentAnswers } from './assessment-form/shared';

export default function AssessmentEditPage() {
    const s = useAssessmentAnswers();

    return (
        <ClinicLayout>
            {s.loading ? (
                <div className="h-full animate-pulse bg-ds-surface-body" />
            ) : s.error || !s.assessment ? (
                <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                    <DsEmptyState
                        title="Avaliação não encontrada"
                        description="Ela pode ser de outra clínica ou ter sido excluída."
                    />
                </div>
            ) : (
                <AssessmentEditScreen s={s} />
            )}
        </ClinicLayout>
    );
}
