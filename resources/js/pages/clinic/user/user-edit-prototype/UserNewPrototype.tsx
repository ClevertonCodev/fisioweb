/**
 * PROTÓTIPO (descartável): cadastro de usuário no DS v2, na rota real
 * /clinica/usuarios/novo, trocado por ?variant= (O = tela v1). É a mesma
 * tela A da edição ("Crachá ao vivo"), no modo criar: campos vazios,
 * placeholders na prévia, senha obrigatória sem código por e-mail e sem
 * Google Agenda. Criar é stub: nada é gravado.
 */
import { can } from '@/application/clinic/permissions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

import { useUserForm } from './form';
import { VariantA } from './VariantA';
import { USER_EDIT_VARIANTS } from './variants';

export default function UserNewPrototype({ variant }: { variant: string }) {
    const { user: authUser } = useAuth();
    const f = useUserForm({ mode: 'create' });

    return (
        <ClinicLayout>
            <VariantA
                user={null}
                f={f}
                // Só administrador chega aqui (RequireClinicAdmin).
                canManageUsers={can.manageUsers(authUser?.role as ClinicRole)}
                isOwnProfile={false}
                roleLocked={false}
                passwordLock={null}
                member={null}
                backTo="/clinica/usuarios"
            />
            <PrototypeSwitcher
                variants={USER_EDIT_VARIANTS}
                current={variant}
            />
        </ClinicLayout>
    );
}
