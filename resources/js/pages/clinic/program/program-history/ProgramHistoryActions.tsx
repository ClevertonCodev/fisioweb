import {
    BookmarkCheck,
    Copy,
    FileDown,
    FileText,
    Link2,
    Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { downloadProgramPdf } from '@/application/clinic/download-program-pdf';
import { formatProgramClinicalRecordText } from '@/application/clinic/format-program-clinical-record-text';
import { can } from '@/application/clinic/permissions';
import {
    findClinicProgram,
    useConvertToModelClinicProgram,
    useDeleteClinicProgram,
    useDuplicateClinicProgram,
} from '@/application/clinic/use-programs';
import { DsActionsMenu, DsButton, DsModal, DsTooltip } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { Program } from '@/domain/clinic';

export type HistoryActionKey =
    | 'link'
    | 'pdf'
    | 'text'
    | 'duplicate'
    | 'model'
    | 'delete';

const footerCell =
    'flex h-10 cursor-pointer items-center justify-center text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ds-dark:hover:text-ds-primary-60 [&_svg]:size-4';

const SHORTCUTS: {
    key: HistoryActionKey;
    label: string;
    icon: typeof Link2;
}[] = [
    { key: 'link', label: 'Copiar link do programa', icon: Link2 },
    { key: 'pdf', label: 'Baixar PDF', icon: FileDown },
    { key: 'text', label: 'Texto para prontuário', icon: FileText },
];

export function useProgramHistoryActions() {
    const { mutate: duplicate } = useDuplicateClinicProgram();
    const { mutate: toModel } = useConvertToModelClinicProgram();
    const { mutate: deleteProgram } = useDeleteClinicProgram();
    const [toDelete, setToDelete] = useState<Program | null>(null);

    const run = useCallback(
        async (key: HistoryActionKey, program: Program) => {
            switch (key) {
                case 'pdf':
                    await downloadProgramPdf(program.id);
                    return;
                case 'text': {
                    try {
                        const full = await findClinicProgram(program.id);
                        if (!full) {
                            toast.error(
                                'Não foi possível carregar o programa.',
                            );
                            return;
                        }
                        const text = formatProgramClinicalRecordText(full);
                        if (!text) {
                            toast.error('Programa sem exercícios para copiar.');
                            return;
                        }
                        await navigator.clipboard.writeText(text);
                        toast.success(
                            'Texto copiado para a área de transferência.',
                        );
                    } catch {
                        toast.error('Não foi possível copiar o texto.');
                    }
                    return;
                }
                case 'link': {
                    try {
                        const full = await findClinicProgram(program.id);
                        if (!full?.shareUrl) {
                            toast.error(
                                'Link de acesso indisponível para este programa.',
                            );
                            return;
                        }
                        await navigator.clipboard.writeText(full.shareUrl);
                        toast.success('Link do programa copiado.');
                    } catch {
                        toast.error('Não foi possível copiar o link.');
                    }
                    return;
                }
                case 'duplicate':
                    duplicate(program.id);
                    return;
                case 'model':
                    toModel(program.id);
                    return;
                case 'delete':
                    setToDelete(program);
                    return;
            }
        },
        [duplicate, toModel],
    );

    const deleteModal = (
        <DsModal
            open={toDelete !== null}
            onOpenChange={(open) => !open && setToDelete(null)}
            title="Excluir rascunho"
            size="sm"
            footer={
                <div className="flex w-full justify-end gap-3">
                    <DsButton
                        variant="secondary"
                        label="Cancelar"
                        onClick={() => setToDelete(null)}
                    />
                    <DsButton
                        variant="destructive"
                        label="Excluir"
                        onClick={() => {
                            if (toDelete) deleteProgram(toDelete.id);
                            setToDelete(null);
                        }}
                    />
                </div>
            }
        >
            <p className="text-ds-body-sm text-ds-content-secondary">
                Excluir <strong>“{toDelete?.title}”</strong>? Esta ação não pode
                ser desfeita.
            </p>
        </DsModal>
    );

    return { run, deleteModal };
}

export function ProgramActionsMenu({
    program,
    onAction,
}: {
    program: Program;
    onAction: (key: HistoryActionKey, program: Program) => void;
}) {
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const canDelete = can.delete(role);
    const isDraft = program.status === 'draft';
    return (
        <DsActionsMenu
            items={[
                {
                    key: 'duplicate',
                    label: 'Duplicar',
                    icon: <Copy />,
                },
                {
                    key: 'model',
                    label: 'Transformar em modelo',
                    icon: <BookmarkCheck />,
                },
                ...(isDraft
                    ? [
                          {
                              key: 'delete',
                              label: 'Excluir rascunho',
                              icon: <Trash2 />,
                              danger: true,
                              disabled: !canDelete,
                              disabledReason:
                                  'Só o admin da clínica pode excluir.',
                          },
                      ]
                    : []),
            ]}
            onSelect={(key) => onAction(key as HistoryActionKey, program)}
        />
    );
}

export function ProgramHistoryCardFooter({
    program,
    onAction,
}: {
    program: Program;
    onAction: (key: HistoryActionKey, program: Program) => void;
}) {
    const hasPatient = Boolean(program.patientId);

    return (
        <div className="relative z-10 -mx-5 -mb-5 grid grid-cols-4 divide-x divide-ds-border-subtle border-t border-ds-border-subtle">
            {SHORTCUTS.map((a) => {
                const disabled = a.key === 'link' && !hasPatient;
                const Icon = a.icon;
                return (
                    <DsTooltip
                        key={a.key}
                        content={
                            disabled
                                ? `${a.label} (programa sem paciente)`
                                : a.label
                        }
                        asChild
                    >
                        <button
                            type="button"
                            aria-label={a.label}
                            disabled={disabled}
                            onClick={() => onAction(a.key, program)}
                            className={footerCell}
                        >
                            <Icon />
                        </button>
                    </DsTooltip>
                );
            })}
            <div className="flex items-center justify-center">
                <ProgramActionsMenu program={program} onAction={onAction} />
            </div>
        </div>
    );
}
