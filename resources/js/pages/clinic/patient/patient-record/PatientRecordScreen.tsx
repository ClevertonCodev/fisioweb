import { ArrowLeft } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { patientDisplayName } from '@/application/clinic/patient-display-name';
import { can } from '@/application/clinic/permissions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { PatientEvolution } from '@/domain/clinic';

import { usePatientRecord, type RecordItem } from './data';
import { EvolutionModal } from './overlays/EvolutionModal';
import { FileUploadModal } from './overlays/FileUploadModal';
import { QuestionnaireDrawer } from './overlays/QuestionnaireDrawer';
import { RecordDrawer, type QuickAction } from './parts';
import { VariantB } from './VariantB';

export default function PatientRecordScreen() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const data = usePatientRecord(id);
    const [openKey, setOpenKey] = useState<string | null>(null);
    const [evolutionOpen, setEvolutionOpen] = useState(false);
    const [evolutionToEdit, setEvolutionToEdit] = useState<
        PatientEvolution | undefined
    >();
    const [fileOpen, setFileOpen] = useState(false);
    const [questionnaireOpen, setQuestionnaireOpen] = useState(false);
    const open = data.items.find((i) => i.key === openKey) ?? null;
    const canManageClinical = can.manageClinicalRecords(user?.role);
    const shownName = data.patient ? patientDisplayName(data.patient) : '';
    const nova = searchParams.get('nova');
    const evolutionShown =
        evolutionOpen || (nova === 'evolucao' && canManageClinical);
    const fileShown = fileOpen || nova === 'arquivo';
    const questionnaireShown = questionnaireOpen || nova === 'questionario';

    const clearNova = useCallback(() => {
        if (!searchParams.has('nova')) return;
        const next = new URLSearchParams(searchParams);
        next.delete('nova');
        setSearchParams(next, { replace: true });
    }, [searchParams, setSearchParams]);

    const runAction = useCallback(
        (action: QuickAction) => {
            switch (action) {
                case 'evolucao':
                    if (!canManageClinical) return;
                    setEvolutionToEdit(undefined);
                    setEvolutionOpen(true);
                    return;
                case 'avaliacao':
                    if (!canManageClinical) return;
                    navigate(`/clinica/pacientes/${id}/avaliacoes/nova`);
                    return;
                case 'questionario':
                    setQuestionnaireOpen(true);
                    return;
                case 'arquivo':
                    setFileOpen(true);
                    return;
                case 'consulta':
                    navigate(`/clinica/agenda?patientId=${id}`, {
                        state: { openNewAppointment: true },
                    });
                    return;
                case 'programa':
                    navigate(`/clinica/programas/novo?patientId=${id}`);
                    return;
            }
        },
        [canManageClinical, id, navigate],
    );

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
                    onAction={runAction}
                    canManageClinical={canManageClinical}
                />
            )}
            <RecordDrawer
                item={open}
                patientId={id}
                patientName={shownName}
                patientPhone={data.patient?.phone}
                patientEmail={data.patient?.email}
                currentUserId={user == null ? undefined : Number(user.id)}
                role={user?.role}
                onClose={() => setOpenKey(null)}
                onEditEvolution={(evolution) => {
                    setOpenKey(null);
                    setEvolutionToEdit(evolution);
                    setEvolutionOpen(true);
                }}
            />
            <EvolutionModal
                key={`${evolutionToEdit?.id ?? 'new'}-${evolutionShown}`}
                open={evolutionShown}
                onOpenChange={(next) => {
                    setEvolutionOpen(next);
                    if (!next) {
                        setEvolutionToEdit(undefined);
                        clearNova();
                    }
                }}
                patientId={id}
                patientName={shownName}
                evolutionToEdit={evolutionToEdit}
            />
            <FileUploadModal
                key={String(fileShown)}
                open={fileShown}
                onOpenChange={(next) => {
                    setFileOpen(next);
                    if (!next) clearNova();
                }}
                patientId={id}
                patientName={shownName}
            />
            <QuestionnaireDrawer
                key={String(questionnaireShown)}
                open={questionnaireShown}
                onOpenChange={(next) => {
                    setQuestionnaireOpen(next);
                    if (!next) clearNova();
                }}
                patientId={id}
                patientName={shownName}
                patientPhone={data.patient?.phone}
                patientEmail={data.patient?.email}
            />
        </ClinicLayout>
    );
}
