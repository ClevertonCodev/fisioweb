/**
 * PROTÓTIPO (descartável): prontuário do paciente no DS v2, na rota real
 * /clinica/pacientes/:id, trocado por ?variant= (O = tela v1). B, o
 * "Painel de acompanhamento", é a escolhida. As variantes descartadas
 * (A, ficha e linha do tempo; C, mesa de leitura) não foram commitadas.
 *
 * Os dados são reais (ver data.ts); o que altera dados é stub.
 * "Nova evolução" e "Enviar arquivo" abrem os protótipos de new-evolution
 * e new-file (?nova=evolucao|arquivo); "Enviar questionário", o de
 * new-questionnaire (?nova=questionario); "Nova avaliação" vai para a rota
 * real, que tem o protótipo da página (assessment-new-prototype).
 */
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import {
    usePatientRecord,
    type PatientRecordData,
    type RecordItem,
} from './data';
import { NewEvolution } from './new-evolution/NewEvolution';
import { NewFile } from './new-file/NewFile';
import { NewQuestionnaire } from './new-questionnaire/NewQuestionnaire';
import { NEW_PARAM, RecordDrawer } from './parts';
import { VariantB } from './VariantB';
import { RECORD_VARIANTS } from './variants';

export interface VariantProps {
    id: string;
    data: PatientRecordData;
    onOpen: (item: RecordItem) => void;
}

export default function PatientRecordPrototype({
    variant,
}: {
    variant: string;
}) {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const data = usePatientRecord(id);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const open = data.items.find((i) => i.key === openKey) ?? null;
    const [params, setParams] = useSearchParams();
    const creating = params.get(NEW_PARAM);
    const closeNew = () =>
        setParams((prev) => {
            const next = new URLSearchParams(prev);
            next.delete(NEW_PARAM);
            return next;
        });
    const newProps = {
        patientId: id,
        patientName: data.patient?.name ?? '',
        onClose: closeNew,
    };

    const props: VariantProps = {
        id,
        data,
        onOpen: (item) => setOpenKey(item.key),
    };

    return (
        <ClinicLayout>
            {data.patientError ? (
                <div className="flex h-full items-center justify-center bg-ds-surface-body p-6 font-ds">
                    <DsEmptyState
                        variant="error"
                        title="Paciente não encontrado"
                        description="Ele não existe ou é de outra clínica."
                        action={
                            <DsButton
                                variant="secondary"
                                iconPosition="left"
                                icon={<ArrowLeft />}
                                label="Voltar para pacientes"
                                onClick={() => navigate('/clinica/pacientes')}
                            />
                        }
                    />
                </div>
            ) : (
                <VariantB {...props} />
            )}

            {creating === 'evolucao' && <NewEvolution {...newProps} />}
            {creating === 'arquivo' && <NewFile {...newProps} />}
            {creating === 'questionario' && <NewQuestionnaire {...newProps} />}
            <RecordDrawer
                item={open}
                patientId={id}
                onClose={() => setOpenKey(null)}
            />
            <PrototypeSwitcher variants={RECORD_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
