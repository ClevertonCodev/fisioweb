import { useParams, useSearchParams } from 'react-router-dom';

import { useClinicProgram } from '@/application/clinic/use-programs';

import ProgramBuilder from './program-builder/ProgramBuilder';

/**
 * Editar programa ou modelo (`?modelo=1`): o mesmo assistente do novo, com o
 * programa carregado pela rota (o loader já buscou; 404 cai na tela de erro).
 */
export default function ProgramEditPage() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const { data: program } = useClinicProgram(id);
    if (!program) return null;
    return (
        <ProgramBuilder
            key={program.id}
            // Modelo é programa sem paciente: `?modelo=1` num programa com
            // paciente não pode tirar o paciente dele ao salvar.
            kind={
                searchParams.has('modelo') && !program.patientId
                    ? 'model'
                    : 'program'
            }
            program={program}
        />
    );
}
