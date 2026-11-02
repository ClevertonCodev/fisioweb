import { ClinicLayout } from '@/components/clinic/ClinicLayout';

import { EvolutionTemplateEditorScreen } from './evolution-template-editor/EvolutionTemplateEditorScreen';

export default function EvolutionTemplateNewPage() {
    return (
        <ClinicLayout>
            <EvolutionTemplateEditorScreen key="novo" template={null} />
        </ClinicLayout>
    );
}
