import { DsButton, DsModal } from '@/components/ds';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

export type UserAction = 'deactivate' | 'reactivate' | 'delete';

export function statusActionOf(user: ClinicUserSummary): UserAction {
    return user.status ? 'deactivate' : 'reactivate';
}

const TEXTS: Record<
    UserAction,
    { title: (name: string) => string; body: string; confirm: string }
> = {
    deactivate: {
        title: (name) => `Desativar ${name}?`,
        // O login barra inativo, e o guard da clínica derruba a sessão aberta (ADR 022).
        body: 'A pessoa perde o acesso na hora: a sessão aberta é encerrada, ela não entra mais pelo login da clínica e o Google Agenda dela é desconectado. O cadastro, a agenda e o histórico continuam, e dá para reativar depois (ela conecta o Google de novo).',
        confirm: 'Desativar',
    },
    reactivate: {
        title: (name) => `Reativar ${name}?`,
        body: 'A pessoa volta a entrar no sistema com o mesmo e-mail e a mesma senha, na função que já tinha.',
        confirm: 'Reativar',
    },
    delete: {
        title: (name) => `Excluir ${name}?`,
        // Soft delete (ADR 022): o que aponta para a pessoa fica, com o nome.
        body: 'A pessoa sai da equipe e perde o acesso na hora. A agenda, os pacientes e o histórico dela continuam guardados, com o nome. Não dá para desfazer pela tela: se ela só vai se afastar, prefira desativar.',
        confirm: 'Excluir',
    },
};

/** Confirmação de desativar, reativar ou excluir alguém da equipe. */
export function UserActionModal({
    open,
    user,
    action,
    pending,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    /** Fica preenchido durante a animação de saída. */
    user: ClinicUserSummary | null;
    action: UserAction;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const texts = TEXTS[action];
    return (
        <DsModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !pending) onCancel();
            }}
            size="sm"
            title={user ? texts.title(user.name) : ''}
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        disabled={pending}
                        onClick={onCancel}
                    />
                    <DsButton
                        variant={
                            action === 'reactivate' ? 'primary' : 'destructive'
                        }
                        label={texts.confirm}
                        loading={pending}
                        onClick={onConfirm}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                {texts.body}
            </p>
        </DsModal>
    );
}
