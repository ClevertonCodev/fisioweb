import { useParams } from 'react-router-dom';

import { useClinicProgram } from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';

import { ProgramDetailPanel } from './program-detail/ProgramDetailPanel';

function Body() {
    const { id } = useParams();
    const { data: program, isLoading } = useClinicProgram(id);
    if (isLoading) {
        return (
            <div
                aria-busy="true"
                aria-label="Carregando programa"
                className="h-full animate-pulse bg-ds-surface-body"
            />
        );
    }
    if (!program) {
        return (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                <DsEmptyState
                    title="Programa não encontrado"
                    description="Ele pode ser de outra clínica ou ter sido excluído."
                />
            </div>
        );
    }
    return <ProgramDetailPanel program={program} />;
}

export default function ProgramDetailPage() {
    return (
        <ClinicLayout>
            <Body />
        </ClinicLayout>
    );
}
