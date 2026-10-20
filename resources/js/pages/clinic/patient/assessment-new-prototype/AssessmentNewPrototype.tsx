/**
 * PROTÓTIPO (descartável): nova avaliação no DS v2, na rota real
 * /clinica/pacientes/:id/avaliacoes/nova, trocada por ?variant= (O = v1).
 * B, "Prévia para experimentar", é a escolhida. As descartadas (A, vitrine
 * de modelos; C, assistente em 3 passos) não foram commitadas.
 *
 * Modelos, paciente e avaliações anteriores são reais; começar e enviar
 * link são stub.
 */
import { useParams } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { ASSESSMENT_VARIANTS, useAssessmentPicker } from './shared';
import { VariantB } from './VariantB';

function Picker({ id }: { id: string }) {
    const p = useAssessmentPicker(id, true);
    return <VariantB p={p} id={id} />;
}

export default function AssessmentNewPrototype({
    variant,
}: {
    variant: string;
}) {
    const { id = '' } = useParams();
    return (
        <ClinicLayout>
            <Picker id={id} />
            <PrototypeSwitcher
                variants={ASSESSMENT_VARIANTS}
                current={variant}
            />
        </ClinicLayout>
    );
}
