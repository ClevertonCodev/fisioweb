/**
 * Cadastro de usuário da clínica no DS v2 ("Crachá ao vivo"): o formulário
 * e, ao lado, como a pessoa vai aparecer na agenda, no cartão do paciente e
 * no PDF. Grava pela API; com foto, envia depois de criar. Só administrador
 * chega aqui (RequireClinicAdmin) e o backend confere de novo (Policy).
 */
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { toClinicUserWriteDto } from '@/application/clinic/clinic-user-form';
import { can } from '@/application/clinic/permissions';
import {
    useCreateClinicUser,
    useUploadClinicUserPhoto,
} from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

import {
    useUserForm,
    type PhotoChange,
    type UserFormValues,
} from './user-form/form';
import { UserFormLayout } from './user-form/UserFormLayout';

export function UserNewPage() {
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const createUser = useCreateClinicUser();
    const uploadPhoto = useUploadClinicUserPhoto();

    const onSave = async (values: UserFormValues, photo: PhotoChange) => {
        const created = await createUser.mutateAsync(
            toClinicUserWriteDto(values),
        );
        if (photo.file) {
            try {
                await uploadPhoto.mutateAsync({
                    id: created.id,
                    file: photo.file,
                });
            } catch {
                toast.warning(
                    'Usuário criado, mas a foto não foi enviada. Tente de novo na edição.',
                );
            }
        }
        navigate('/clinica/usuarios');
    };

    const f = useUserForm({ mode: 'create', onSave });

    return (
        <ClinicLayout>
            <UserFormLayout
                user={null}
                f={f}
                canManageUsers={can.manageUsers(authUser?.role as ClinicRole)}
                isOwnProfile={false}
                roleLocked={false}
                backTo="/clinica/usuarios"
            />
        </ClinicLayout>
    );
}
