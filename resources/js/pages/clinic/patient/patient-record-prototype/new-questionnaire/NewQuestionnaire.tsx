/**
 * PROTÓTIPO (descartável): enviar questionário, aberto pelo prontuário B
 * (?nova=questionario), trocado por ?questionario= (O = gaveta atual da v1,
 * que envia de verdade). A, "Escolher e prever", é a escolhida e é stub
 * ao enviar; as descartadas (B, uma frase só; C, entregar o tablet) não
 * foram commitadas.
 */
import { QuestionnaireFormSheet } from '@/components/clinic/patient/QuestionnaireFormSheet';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/PrototypeSwitcher';

import { QUESTIONNAIRE_VARIANTS, useQuestionnaireSend } from './shared';
import { VariantA } from './VariantA';

interface Props {
    patientId: string;
    patientName: string;
    onClose: () => void;
}

function Sender(props: Props) {
    const s = useQuestionnaireSend(props.patientId, props.onClose);
    return <VariantA s={s} {...props} />;
}

export function NewQuestionnaire(props: Props) {
    const variant = usePrototypeVariant(
        QUESTIONNAIRE_VARIANTS,
        'A',
        'questionario',
    );
    return (
        <>
            {variant === 'O' ? (
                <QuestionnaireFormSheet
                    open
                    onOpenChange={(o) => !o && props.onClose()}
                    patientId={props.patientId}
                    patientRecordPath={`/clinica/pacientes/${props.patientId}`}
                />
            ) : (
                <Sender {...props} />
            )}
            <PrototypeSwitcher
                variants={QUESTIONNAIRE_VARIANTS}
                current={variant}
                param="questionario"
                scope="dialog"
                prefix="Questionário"
            />
        </>
    );
}
