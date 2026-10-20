/**
 * PROTÓTIPO (descartável): edição de usuário no DS v2, na rota real
 * /clinica/usuarios/:id/editar, trocado por ?variant= (O = tela v1). A,
 * "Crachá ao vivo", é a escolhida: o formulário e, ao lado, como a pessoa
 * aparece no sistema. As variantes descartadas (B, central da conta; C,
 * ficha com revisão) não foram commitadas.
 *
 * Mesmas regras da v1: só administrador muda função e situação, o mestre
 * fica administrador, e o Google Agenda só aparece no próprio perfil.
 * Senha (ADR 019): só administrador troca a de outra pessoa, só o mestre a
 * de outro administrador, e a do mestre ninguém além dele; trocar pede um
 * código enviado a quem está logado.
 * Os dados são reais; salvar é stub.
 */
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    normalizeClinicUserRole,
    type ClinicUserFormRole,
} from '@/application/clinic/clinic-user-form';
import { can } from '@/application/clinic/permissions';
import { useClinicUser } from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, DsEmptyState } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { passwordLockReason, useUserForm } from './form';
import { PasswordCodeModal, roleLabel, type VariantProps } from './parts';
import { useTeam } from './team-data';
import { VariantA } from './VariantA';
import { USER_EDIT_VARIANTS } from './variants';

export default function UserEditPrototype({ variant }: { variant: string }) {
    const { id = '' } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();
    const { data: user, isLoading, isError } = useClinicUser(id);
    const canManageUsers = can.manageUsers(authUser?.role as ClinicRole);
    const role = user ? normalizeClinicUserRole(user.role) : null;

    let body;
    if (isLoading) {
        body = (
            <div className="flex h-full items-center justify-center bg-ds-surface-body font-ds text-ds-body-sm text-ds-content-muted">
                Carregando…
            </div>
        );
    } else if (isError || !user || !role) {
        body = (
            <div className="flex h-full items-center justify-center bg-ds-surface-body p-6 font-ds">
                <DsEmptyState
                    variant="error"
                    title="Usuário não encontrado"
                    description="Ele não existe ou é de outra clínica."
                    action={
                        <DsButton
                            variant="secondary"
                            iconPosition="left"
                            icon={<ArrowLeft />}
                            label="Voltar"
                            onClick={() => navigate('/clinica/usuarios')}
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
                // ADR 019: o código vai a quem está logado, nunca ao alvo
                // (no próprio perfil, os dois são a mesma pessoa).
                signerEmail={
                    authUser?.email ||
                    (String(authUser?.id) === String(user.id) ? user.email : '')
                }
                editor={{
                    id: authUser?.id ?? '',
                    role: authUser?.role,
                    mestre: authUser?.mestre,
                }}
            />
        );
    }

    return (
        <ClinicLayout>
            {body}
            <PrototypeSwitcher
                variants={USER_EDIT_VARIANTS}
                current={variant}
            />
        </ClinicLayout>
    );
}

function Editor({
    user,
    role,
    canManageUsers,
    isOwnProfile,
    signerEmail,
    editor,
}: {
    user: ClinicUserSummary;
    role: ClinicUserFormRole;
    canManageUsers: boolean;
    isOwnProfile: boolean;
    /** Quem está logado: recebe o código da troca de senha. */
    signerEmail: string;
    editor: Parameters<typeof passwordLockReason>[0];
}) {
    const f = useUserForm({
        mode: 'edit',
        user,
        role,
        roleLabel,
        codeRecipient: signerEmail,
    });
    const team = useTeam();
    const props: VariantProps = {
        user,
        f,
        canManageUsers,
        isOwnProfile,
        roleLocked: user.mestre === 1,
        // Sem e-mail de quem está logado, não há para onde mandar o código.
        passwordLock: signerEmail
            ? passwordLockReason(
                  {
                      ...editor,
                      // A sessão pode não trazer "mestre": a equipe traz.
                      mestre:
                          editor.mestre ??
                          team.members.find((m) => m.id === String(editor.id))
                              ?.mestre,
                  },
                  user,
              )
            : 'Sua sessão não tem e-mail para receber o código da troca.',
        member: team.members.find((m) => m.id === user.id) ?? null,
        backTo: canManageUsers ? '/clinica/usuarios' : '/clinica',
    };
    return (
        <>
            <VariantA {...props} />
            <PasswordCodeModal
                f={f}
                targetName={user.name}
                isOwnProfile={isOwnProfile}
            />
        </>
    );
}
