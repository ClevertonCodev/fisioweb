import { useParams } from 'react-router-dom';

import { useEvolutionTemplate } from '@/application/clinic/use-evolutions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';

import { EvolutionTemplateEditorScreen } from './evolution-template-editor/EvolutionTemplateEditorScreen';

export default function EvolutionTemplateEditPage() {
    const { id } = useParams<{ id: string }>();
    const templateQuery = useEvolutionTemplate(id ?? '');

    return (
        <ClinicLayout>
            {templateQuery.isLoading ? (
                <div className="h-full animate-pulse bg-ds-surface-body" />
            ) : !templateQuery.data ? (
                <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                    <DsEmptyState
                        title="Modelo não encontrado"
                        description="Ele pode ser de outra clínica ou ter sido excluído."
                    />
                </div>
            ) : (
                <EvolutionTemplateEditorScreen
                    key={id}
                    template={templateQuery.data}
                />
            )}
        </ClinicLayout>
    );
}
