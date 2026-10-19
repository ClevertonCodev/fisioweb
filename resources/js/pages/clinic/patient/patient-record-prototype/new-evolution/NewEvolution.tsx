/**
 * PROTÓTIPO (descartável): nova evolução aberta pelo prontuário B
 * (?nova=evolucao), trocada por ?evolucao= (O = gaveta atual da v1, que
 * salva de verdade). B, "Folha da evolução", é a escolhida e é stub ao
 * salvar; as descartadas (A, chips; C, atalhos) não foram commitadas.
 */
import { EvolutionFormDrawer } from '@/components/clinic/patient/EvolutionFormDrawer';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { EVOLUTION_VARIANTS, useEvolutionComposer } from './shared';
import { VariantB } from './VariantB';

interface Props {
    patientId: string;
    patientName: string;
    onClose: () => void;
}

function Composer(props: Props) {
    const c = useEvolutionComposer(props.patientId, props.onClose);
    return <VariantB c={c} {...props} />;
}

export function NewEvolution(props: Props) {
    const variant = usePrototypeVariant(EVOLUTION_VARIANTS, 'B', 'evolucao');
    return (
        <>
            {variant === 'O' ? (
                <EvolutionFormDrawer
                    open
                    onOpenChange={(o) => !o && props.onClose()}
                    patientId={props.patientId}
                />
            ) : (
                <Composer {...props} />
            )}
            <PrototypeSwitcher
                variants={EVOLUTION_VARIANTS}
                current={variant}
                param="evolucao"
                scope="dialog"
                prefix="Evolução"
            />
        </>
    );
}
