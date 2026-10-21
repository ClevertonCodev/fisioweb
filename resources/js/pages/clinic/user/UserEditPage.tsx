/**
 * Edição de usuário da clínica no DS v2 ("Crachá ao vivo"): a mesma tela do
 * cadastro, com os dados do usuário. Grava pela API; foto nova é enviada
 * depois, foto removida é apagada. Função e situação só para quem gerencia
 * usuários; o mestre fica administrador e ativo. Senha em branco mantém a
 * atual (como na v1; o código do ADR 019 ainda não existe no backend).
 */
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    normalizeClinicUserRole,
    type ClinicUserFormRole,
} from '@/application/clinic/clinic-user-form';
import { can } from '@/application/clinic/permissions';
import type { ClinicUserUpdateDto } from '@/application/clinic/ports';
import {
    useClinicUser,
    useDeleteClinicUserPhoto,
    useUpdateClinicUser,
    useUploadClinicUserPhoto,
} from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { serializeClinicUserDocument } from '@/lib/br-document-validation';

import {
    useUserForm,
    type PhotoChange,
    type UserFormValues,
} from './user-form/form';
import { roleLabel } from './user-form/parts';
import { UserFormLayout } from './user-form/UserFormLayout';

export function UserEditPage() {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { data: user, isLoading, isError } = useClinicUser(id);
    const canManageUsers = can.manageUsers(authUser?.role as ClinicRole);
    const role = user ? normalizeClinicUserRole(user.role) : null;
    const backTo = canManageUsers ? '/clinica/usuarios' : '/clinica';

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
    } else if (isError || !user || !role) {
        body = (
            <div className="flex h-full items-center justify-center bg-ds-surface-body p-6 font-ds">
                <DsEmptyState
                    variant="error"
                    title="Usuário não encontrado"
                    description="Ele não existe ou você não tem acesso a ele."
                    action={
                        <DsButton
                            variant="secondary"
                            iconPosition="left"
                            icon={<ArrowLeft />}
                            label="Voltar"
                            onClick={() => navigate(backTo)}
                        />
                    }
                />
            </div>
        );
    } else {
        body = (
            <Editor
                key={user.id}
                user={user}
                role={role}
                canManageUsers={canManageUsers}
                isOwnProfile={String(authUser?.id) === String(user.id)}
                backTo={backTo}
            />
        );
    }

    return <ClinicLayout>{body}</ClinicLayout>;
}

function Editor({
    user,
    role,
    canManageUsers,
    isOwnProfile,
    backTo,
}: {
    user: ClinicUserSummary;
    role: ClinicUserFormRole;
    canManageUsers: boolean;
    isOwnProfile: boolean;
    backTo: string;
}) {
    const navigate = useNavigate();
    const updateUser = useUpdateClinicUser(user.id);
    const uploadPhoto = useUploadClinicUserPhoto();
    const deletePhoto = useDeleteClinicUserPhoto();

    const onSave = async (values: UserFormValues, photo: PhotoChange) => {
        const payload: ClinicUserUpdateDto = {
            name: values.name,
            email: values.email,
            document: serializeClinicUserDocument(
                values.documentKind,
                values.document,
            ),
        };
        // O backend também ignora função e situação de quem não é admin.
        if (canManageUsers) {
            payload.role = values.role;
            payload.status = Number(values.status ?? '1');
        }
        if (values.password?.trim()) payload.password = values.password;

        await updateUser.mutateAsync(payload);
        // Os dados já estão salvos: se a foto falhar, o hook dela avisa e a
        // tela segue.
        try {
            if (photo.file) {
                await uploadPhoto.mutateAsync({
                    id: user.id,
                    file: photo.file,
                });
            } else if (photo.removed) {
                await deletePhoto.mutateAsync(user.id);
            }
        } catch {
            // aviso já mostrado pelo hook da foto
        }
        navigate(backTo);
    };

    const f = useUserForm({ mode: 'edit', user, role, roleLabel, onSave });

    return (
        <UserFormLayout
            user={user}
            f={f}
            canManageUsers={canManageUsers}
            isOwnProfile={isOwnProfile}
            roleLocked={user.mestre === 1}
            backTo={backTo}
        />
    );
}
