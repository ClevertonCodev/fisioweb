/**
 * PROTÓTIPO (descartável): detalhe do programa no DS v2, na rota real
 * /clinica/programas/:id, trocada por ?variant= (O = v1).
 *
 * A, "Painel do programa", é a escolhida. As descartadas (B, semana do
 * paciente; C, celular do paciente) não foram commitadas. Programa real; PDF, texto do prontuário e copiar link são
 * reais; WhatsApp, duplicar, transformar em modelo e excluir são stub.
 */
import { useParams } from 'react-router-dom';

import { useClinicProgram } from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsEmptyState } from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { DETAIL_VARIANTS } from './shared';
import { VariantA } from './VariantA';

function Body() {
    const { id } = useParams();
    const { data: program, isLoading } = useClinicProgram(id);
    if (isLoading) {
        return <div className="h-full animate-pulse bg-ds-surface-body" />;
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
    return <VariantA program={program} />;
}

export default function ProgramDetailPrototype({
    variant,
}: {
    variant: string;
}) {
    return (
        <ClinicLayout>
            <Body />
            <PrototypeSwitcher variants={DETAIL_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
