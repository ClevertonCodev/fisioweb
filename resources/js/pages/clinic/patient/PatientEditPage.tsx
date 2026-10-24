/**
 * Edição de paciente da clínica no DS v2: o mesmo layout do cadastro,
 * com os dados do paciente. Grava pelo PUT; foto nova é enviada depois,
 * foto removida é apagada. Situação aceita todas as opções.
 */
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    toPatientFormValues,
    toPatientUpdateDto,
    type PatientFormValues,
} from '@/application/clinic/patient-form';
import {
    useDeletePatientPhoto,
    usePatientDetail,
    useUpdatePatient,
    useUploadPatientPhoto,
} from '@/application/clinic/use-patients';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import type { PatientDetail } from '@/domain/clinic/patient';

import { usePatientForm, type PhotoChange } from './patient-form/form';
import { PatientFormLayout } from './patient-form/PatientFormLayout';

export function PatientEditPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { data: detail, isLoading, isError } = usePatientDetail(id);

    let body;
    if (isLoading) {
        body = (
            <div
                role="status"
                className="flex h-full items-center justify-center bg-ds-surface-body font-ds text-ds-body-sm text-ds-content-muted"
            >
                Carregando…
            </div>
        );
    } else if (isError || !detail) {
        body = (
            <div className="flex h-full items-center justify-center bg-ds-surface-body p-6 font-ds">
                <DsEmptyState
                    variant="error"
                    title="Paciente não encontrado"
                    description="Ele não existe ou você não tem acesso a ele."
                    action={
                        <DsButton
                            variant="secondary"
                            iconPosition="left"
                            icon={<ArrowLeft />}
                            label="Voltar"
                            onClick={() => navigate('/clinica/pacientes')}
                        />
                    }
                />
            </div>
        );
    } else {
        body = <Editor key={detail.id} id={detail.id} detail={detail} />;
    }

    return <ClinicLayout>{body}</ClinicLayout>;
}

function Editor({ id, detail }: { id: string; detail: PatientDetail }) {
    const navigate = useNavigate();
    const updatePatient = useUpdatePatient();
    const uploadPhoto = useUploadPatientPhoto();
    const deletePhoto = useDeletePatientPhoto();
    const backTo = `/clinica/pacientes/${id}`;

    const onSave = async (values: PatientFormValues, photo: PhotoChange) => {
        await updatePatient.mutateAsync({
            id,
            dto: toPatientUpdateDto(values),
        });
        if (photo.file) {
            try {
                await uploadPhoto.mutateAsync({ id, file: photo.file });
            } catch {
                toast.warning(
                    'Paciente atualizado, mas falha ao enviar a foto. Tente novamente.',
                );
                navigate(backTo);
                return;
            }
        } else if (photo.removed) {
            try {
                await deletePhoto.mutateAsync(id);
            } catch {
                toast.warning(
                    'Paciente atualizado, mas falha ao remover a foto. Tente novamente.',
                );
                navigate(backTo);
                return;
            }
        }
        navigate(backTo);
    };

    const f = usePatientForm({
        mode: 'edit',
        defaultValues: toPatientFormValues(detail),
        savedPhotoUrl: detail.photoUrl,
        onSave,
        onCancel: () => navigate(backTo),
    });

    return (
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <PatientFormLayout f={f} />
        </div>
    );
}

export default PatientEditPage;
