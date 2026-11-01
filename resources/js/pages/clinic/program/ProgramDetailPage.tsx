import { useParams } from 'react-router-dom';

import { useClinicProgram } from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';

import { ProgramDetailPanel } from './program-detail/ProgramDetailPanel';

function Body() {
    const { id } = useParams();
    const { data: program, isLoading, isError, refetch } = useClinicProgram(id);
    if (isLoading) {
        return (
            <div
                aria-busy="true"
                aria-label="Carregando programa"
                className="h-full animate-pulse bg-ds-surface-body"
            />
        );
    }
    if (isError) {
        return (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds">
                <DsEmptyState
                    variant="error"
                    title="Não foi possível carregar o programa"
                    description="Confira a conexão e tente de novo."
                    action={
                        <DsButton
                            variant="secondary"
                            label="Tentar de novo"
                            onClick={() => void refetch()}
                        />
                    }
                />
            </div>
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
