/**
 * PROTÓTIPO (descartável): prontuário do paciente no DS v2, na rota real
 * /clinica/pacientes/:id, trocado por ?variant= (O = tela v1). B, o
 * "Painel de acompanhamento", é a escolhida. As variantes descartadas
 * (A, ficha e linha do tempo; C, mesa de leitura) não foram commitadas.
 *
 * Os dados são reais (ver data.ts); o que altera dados é stub.
 */
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import {
    usePatientRecord,
    type PatientRecordData,
    type RecordItem,
} from './data';
import { RecordDrawer } from './parts';
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

            <RecordDrawer
                item={open}
                patientId={id}
                onClose={() => setOpenKey(null)}
            />
            <PrototypeSwitcher variants={RECORD_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
