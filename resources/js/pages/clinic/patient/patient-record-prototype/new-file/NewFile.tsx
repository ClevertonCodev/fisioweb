/**
 * PROTÓTIPO (descartável): enviar arquivo, aberto pelo prontuário B
 * (?nova=arquivo), trocado por ?arquivo= (O = modal atual da v1, que envia
 * de verdade). B, "Foto do documento", é a escolhida e simula o envio; a
 * descartada (A, fila de arquivos) não foi commitada.
 */
import { PatientFileUploadModal } from '@/components/clinic/patient/PatientFileUploadModal';
import {
    PrototypeSwitcher,
    usePrototypeVariant,
} from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import { FILE_VARIANTS, useFileQueue } from './shared';
import { VariantB } from './VariantB';

interface Props {
    patientId: string;
    patientName: string;
    onClose: () => void;
}

function Uploader(props: Props) {
    const q = useFileQueue();
    return <VariantB q={q} {...props} />;
}

export function NewFile(props: Props) {
    const variant = usePrototypeVariant(FILE_VARIANTS, 'B', 'arquivo');
    return (
        <>
            {variant === 'O' ? (
                <PatientFileUploadModal
                    open
                    onOpenChange={(o) => !o && props.onClose()}
                    patientId={props.patientId}
                />
            ) : (
                <Uploader {...props} />
            )}
            <PrototypeSwitcher
                variants={FILE_VARIANTS}
                current={variant}
                param="arquivo"
                scope="dialog"
                prefix="Arquivo"
            />
        </>
    );
}
