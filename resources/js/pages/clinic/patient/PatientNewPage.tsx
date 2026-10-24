/**
 * Cadastro de paciente da clínica no DS v2 (abas + painel). Grava pela API;
 * com foto, envia depois de criar. Admin, secretário(a) e fisioterapeuta
 * chegam aqui; o backend isola por clínica.
 */
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import {
    toPatientWriteDto,
    type PatientFormValues,
} from '@/application/clinic/patient-form';
import {
    useCreatePatient,
    useUploadPatientPhoto,
} from '@/application/clinic/use-patients';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';

import {
    PATIENTS_PATH,
    usePatientForm,
    type PhotoChange,
} from './patient-form/form';
import { PatientFormLayout } from './patient-form/PatientFormLayout';

export function PatientNewPage() {
    const navigate = useNavigate();
    const createPatient = useCreatePatient();
    const uploadPhoto = useUploadPatientPhoto();

    const onSave = async (values: PatientFormValues, photo: PhotoChange) => {
        const created = await createPatient.mutateAsync(
            toPatientWriteDto(values),
        );
        if (photo.file) {
            try {
                await uploadPhoto.mutateAsync({
                    id: created.id,
                    file: photo.file,
                });
            } catch {
                toast.warning(
                    'Paciente criado, mas falha ao enviar a foto. Você pode tentar novamente na edição.',
                );
                navigate(PATIENTS_PATH);
                return;
            }
        }
        navigate(PATIENTS_PATH);
    };

    const f = usePatientForm({
        mode: 'create',
        onSave,
        onCancel: () => navigate(PATIENTS_PATH),
    });

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <PatientFormLayout f={f} />
            </div>
        </ClinicLayout>
    );
}

export default PatientNewPage;
