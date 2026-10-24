import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { createDraftSection } from '@/components/clinic/questionnaire-template/types';

import { QuestionnaireNewScreen } from './questionnaire-template-new/QuestionnaireNewScreen';
import { useQuestionnaireBuilder } from './questionnaire-template-new/shared';

export default function QuestionnaireTemplateNewPage() {
    const b = useQuestionnaireBuilder([
        { ...createDraftSection(), title: 'Perguntas', questions: [] },
    ]);

    return (
        <ClinicLayout>
            <QuestionnaireNewScreen b={b} />
        </ClinicLayout>
    );
}
