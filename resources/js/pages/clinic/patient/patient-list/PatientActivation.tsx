import { UserCheck, UserX } from 'lucide-react';

import { DsButton, DsModal, DsTooltip, dsCn } from '@/components/ds';
import type { Patient } from '@/domain/clinic/patient';

/** Paciente ativo: inativar. Paciente inativo: reativar. */
export type ActivationMode = 'inactivate' | 'reactivate';

export function activationModeOf(patient: Patient): ActivationMode {
    return patient.isActive ? 'inactivate' : 'reactivate';
}

const TEXTS: Record<
    ActivationMode,
    {
        action: string;
        denied: string;
        title: (name: string) => string;
        body: string;
        confirm: string;
    }
> = {
    inactivate: {
        action: 'Inativar paciente',
        denied: 'Apenas admin ou secretária podem inativar pacientes',
        title: (name) => `Inativar ${name}?`,
        body: 'O paciente sai da lista de ativos. O cadastro, o prontuário e os programas continuam guardados, e ele pode ser reativado depois.',
        confirm: 'Inativar',
    },
    reactivate: {
        action: 'Reativar paciente',
        denied: 'Apenas admin ou secretária podem reativar pacientes',
        title: (name) => `Reativar ${name}?`,
        body: 'O paciente volta para a lista de ativos, com o cadastro, o prontuário e os programas como estavam.',
        confirm: 'Reativar',
    },
};

/**
 * Quarta casa do rodapé do cartão. Sem permissão, o botão fica
 * `aria-disabled` (e não `disabled`) para continuar recebendo foco e hover:
 * assim o tooltip com o motivo chega também a quem usa o teclado.
 */
export function PatientActivationButton({
    mode,
    allowed,
    onRequest,
}: {
    mode: ActivationMode;
    allowed: boolean;
    onRequest: () => void;
}) {
    const texts = TEXTS[mode];
    return (
        <DsTooltip content={allowed ? texts.action : texts.denied} asChild>
            <button
                type="button"
                aria-label={texts.action}
                aria-disabled={allowed ? undefined : true}
                onClick={allowed ? onRequest : undefined}
                className={dsCn(
                    'flex h-10 cursor-pointer items-center justify-center transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0 [&_svg]:size-4',
                    !allowed
                        ? 'cursor-not-allowed text-ds-content-muted'
                        : mode === 'inactivate'
                          ? 'text-ds-content-danger hover:bg-ds-status-danger-surface'
                          : 'text-ds-content-secondary hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand ds-dark:hover:text-ds-primary-60',
                )}
            >
                {mode === 'inactivate' ? <UserX /> : <UserCheck />}
            </button>
        </DsTooltip>
    );
}

export function PatientActivationModal({
    open,
    patient,
    mode,
    pending,
    onConfirm,
    onCancel,
}: {
    open: boolean;
    /** Fica preenchido durante a animação de saída. */
    patient: Patient | null;
    mode: ActivationMode;
    pending: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const texts = TEXTS[mode];
    return (
        <DsModal
            open={open}
            onOpenChange={(next) => {
                if (!next && !pending) onCancel();
            }}
            size="sm"
            title={patient ? texts.title(patient.name) : ''}
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
                            mode === 'inactivate' ? 'destructive' : 'primary'
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
