import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';

import { usePatientRecord, type RecordItem } from './data';
import { RecordDrawer } from './parts';
import { VariantB } from './VariantB';

export default function PatientRecordScreen() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const data = usePatientRecord(id);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const open = data.items.find((i) => i.key === openKey) ?? null;

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
                <VariantB
                    id={id}
                    data={data}
                    onOpen={(item: RecordItem) => setOpenKey(item.key)}
                />
            )}
            <RecordDrawer
                item={open}
                patientId={id}
                onClose={() => setOpenKey(null)}
            />
        </ClinicLayout>
    );
}
