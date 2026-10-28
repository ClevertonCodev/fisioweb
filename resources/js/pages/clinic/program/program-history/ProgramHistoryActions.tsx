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

export interface ProgramActionsOptions {
    /** Depois de duplicar com sucesso (o painel abre a cópia). */
    onDuplicated?: (copy: Program) => void;
    /** Depois de excluir com sucesso (o painel volta ao Histórico). */
    onDeleted?: () => void;
}

export function useProgramHistoryActions({
    onDuplicated,
    onDeleted,
}: ProgramActionsOptions = {}) {
    const { mutate: duplicate, isPending: duplicating } =
        useDuplicateClinicProgram();
    const { mutate: toModel, isPending: convertingToModel } =
        useConvertToModelClinicProgram();
    const { mutate: deleteProgram, isPending: deleting } =
        useDeleteClinicProgram();
    const [toDelete, setToDelete] = useState<Program | null>(null);
    // Enquanto uma cópia ou um modelo está sendo criado, o segundo clique
    // criaria outro registro.
    const busy = duplicating || convertingToModel;

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
                    if (busy) return;
                    duplicate(program.id, {
                        onSuccess: (copy) => onDuplicated?.(copy),
                    });
                    return;
                case 'model':
                    if (busy) return;
                    toModel(program.id);
                    return;
                case 'delete':
                    setToDelete(program);
                    return;
            }
        },
        [busy, duplicate, toModel, onDuplicated],
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
                        loading={deleting}
                        onClick={() => {
                            // O modal só fecha quando a exclusão volta; se
                            // falhar, fica aberto com o aviso de erro.
                            if (toDelete) {
                                deleteProgram(toDelete.id, {
                                    onSuccess: () => {
                                        setToDelete(null);
                                        onDeleted?.();
                                    },
                                });
                            }
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

    return { run, deleteModal, busy };
}

const BUSY_REASON = 'Aguarde: a ação anterior ainda está em andamento.';

/** Por que o link do programa não pode ser copiado, ou null se pode. */
function linkBlockedReason(program: Program, isDraft: boolean): string | null {
    if (!program.patientId) return 'Programa sem paciente.';
    if (isDraft) return 'Rascunho: o paciente ainda não recebeu.';
    return null;
}

/**
 * Menu ⋯ do programa. Com `withShortcuts`, entram no topo os atalhos que no
 * Histórico ficam no rodapé do cartão (link, PDF, texto) — é o caso do
 * painel do programa, que não tem rodapé.
 */
export function ProgramActionsMenu({
    program,
    onAction,
    withShortcuts = false,
    busy = false,
}: {
    program: Program;
    onAction: (key: HistoryActionKey, program: Program) => void;
    withShortcuts?: boolean;
    /** Uma cópia ou um modelo ainda está sendo criado. */
    busy?: boolean;
}) {
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const canDelete = can.delete(role);
    const isDraft = program.status === 'draft';
    const linkBlocked = linkBlockedReason(program, isDraft);
    const shortcuts = withShortcuts
        ? SHORTCUTS.map((a) => {
              const Icon = a.icon;
              const blocked = a.key === 'link' ? linkBlocked : null;
              return {
                  key: a.key,
                  label: a.label,
                  icon: <Icon />,
                  disabled: blocked !== null,
                  disabledReason: blocked ?? undefined,
              };
          })
        : [];
    return (
        <DsActionsMenu
            items={[
                ...shortcuts,
                {
                    key: 'duplicate',
                    label: 'Duplicar',
                    icon: <Copy />,
                    disabled: busy,
                    disabledReason: BUSY_REASON,
                },
                {
                    key: 'model',
                    label: 'Transformar em modelo',
                    icon: <BookmarkCheck />,
                    disabled: busy,
                    disabledReason: BUSY_REASON,
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
    busy = false,
}: {
    program: Program;
    onAction: (key: HistoryActionKey, program: Program) => void;
    busy?: boolean;
}) {
    const linkBlocked = linkBlockedReason(program, program.status === 'draft');

    return (
        <div className="relative z-10 -mx-5 -mb-5 grid grid-cols-4 divide-x divide-ds-border-subtle border-t border-ds-border-subtle">
            {SHORTCUTS.map((a) => {
                const blocked = a.key === 'link' ? linkBlocked : null;
                const disabled = blocked !== null;
                const Icon = a.icon;
                return (
                    <DsTooltip
                        key={a.key}
                        content={blocked ? `${a.label}: ${blocked}` : a.label}
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
                <ProgramActionsMenu
                    program={program}
                    onAction={onAction}
                    busy={busy}
                />
            </div>
        </div>
    );
}
