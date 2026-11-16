/**
 * Comprovantes do lançamento (tarefa 014): até 5 fotos ou PDFs de até 10 MB.
 * Abrir pede um link assinado de poucos minutos (nunca há URL pública);
 * remover pede confirmação na própria linha. No celular, "Tirar foto" abre a
 * câmera direto. O lançamento novo ainda não tem id: o aviso pede para lançar
 * antes.
 */
import {
    Camera,
    FileText,
    Image,
    Paperclip,
    Trash2,
    Upload,
} from 'lucide-react';
import { useId, useRef, useState, type ChangeEvent } from 'react';

import {
    ATTACHMENT_ACCEPT,
    checkAttachmentFiles,
    formatFileSize,
} from '@/application/clinic/finance-attachment-rules';
import {
    attachmentErrorsOf,
    useDeleteFinanceAttachment,
    useFinanceAttachments,
    useOpenFinanceAttachment,
    useUploadFinanceAttachments,
} from '@/application/clinic/use-finance-attachments';
import { DsButton } from '@/components/ds';
import {
    FINANCE_ATTACHMENT_LIMITS,
    type FinanceAttachment,
} from '@/domain/clinic/finance-attachment';

const { maxFiles } = FINANCE_ATTACHMENT_LIMITS;

function AreaFrame({
    count,
    children,
}: {
    count?: number;
    children: React.ReactNode;
}) {
    const titleId = useId();
    return (
        <section
            aria-labelledby={titleId}
            className="flex flex-col gap-3 rounded-ds-md border border-ds-border-default p-3"
        >
            <div className="flex items-center gap-2">
                <Paperclip
                    className="size-4 text-ds-content-secondary"
                    aria-hidden="true"
                />
                <h3
                    id={titleId}
                    className="text-ds-body-sm font-medium text-ds-content-primary"
                >
                    Comprovantes
                </h3>
                {count !== undefined && (
                    <span className="ml-auto font-ds-mono text-ds-caption text-ds-content-secondary">
                        {count} de {maxFiles}
                    </span>
                )}
            </div>
            {children}
        </section>
    );
}

/** Lançamento novo: sem id, ainda não há onde guardar o comprovante. */
export function TransactionAttachmentsHint() {
    return (
        <AreaFrame>
            <p className="text-ds-caption text-ds-content-secondary">
                Lance primeiro; depois, abra o lançamento para anexar até{' '}
                {maxFiles} comprovantes (foto ou PDF, até 10 MB cada).
            </p>
        </AreaFrame>
    );
}

export function TransactionAttachments({
    transactionId,
}: {
    transactionId: string;
}) {
    const list = useFinanceAttachments(transactionId);
    const upload = useUploadFinanceAttachments(transactionId);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInput = useRef<HTMLInputElement>(null);
    const cameraInput = useRef<HTMLInputElement>(null);

    const attachments = list.data ?? [];
    const full = attachments.length >= maxFiles;

    const send = async (event: ChangeEvent<HTMLInputElement>) => {
        const chosen = Array.from(event.target.files ?? []);
        // Limpa o input para a mesma foto poder ser escolhida de novo.
        event.target.value = '';
        if (chosen.length === 0) return;

        const { accepted, errors: local } = checkAttachmentFiles(
            chosen,
            attachments.length,
        );
        setErrors(local);
        if (accepted.length === 0) return;
        try {
            await upload.mutateAsync(accepted);
        } catch (error) {
            setErrors([...local, ...attachmentErrorsOf(error)]);
        }
    };

    if (list.isPending)
        return (
            <AreaFrame>
                <p className="text-ds-caption text-ds-content-secondary">
                    Carregando comprovantes…
                </p>
            </AreaFrame>
        );

    if (list.isError)
        return (
            <AreaFrame>
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-ds-caption text-ds-status-danger-content">
                        Não foi possível carregar os comprovantes.
                    </p>
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        label="Tentar de novo"
                        onClick={() => void list.refetch()}
                    />
                </div>
            </AreaFrame>
        );

    return (
        <AreaFrame count={attachments.length}>
            {attachments.length > 0 && (
                <ul className="flex flex-col divide-y divide-ds-border-default">
                    {attachments.map((attachment) => (
                        <AttachmentRow
                            key={attachment.id}
                            transactionId={transactionId}
                            attachment={attachment}
                        />
                    ))}
                </ul>
            )}

            {errors.length > 0 && (
                <ul
                    role="alert"
                    className="flex flex-col gap-1 text-ds-caption text-ds-status-danger-content"
                >
                    {errors.map((message) => (
                        <li key={message}>{message}</li>
                    ))}
                </ul>
            )}

            {full ? (
                <p className="text-ds-caption text-ds-content-secondary">
                    Limite de {maxFiles} comprovantes. Remova um para enviar
                    outro.
                </p>
            ) : (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        <DsButton
                            variant="secondary"
                            size="sm"
                            iconPosition="left"
                            icon={<Camera />}
                            label="Tirar foto"
                            className="sm:hidden"
                            loading={upload.isPending}
                            onClick={() => cameraInput.current?.click()}
                        />
                        <DsButton
                            variant="secondary"
                            size="sm"
                            iconPosition="left"
                            icon={<Upload />}
                            label="Enviar arquivo"
                            loading={upload.isPending}
                            onClick={() => fileInput.current?.click()}
                        />
                    </div>
                    <p className="text-ds-caption text-ds-content-secondary">
                        JPG, PNG, WEBP, HEIC ou PDF, até 10 MB cada.
                    </p>
                    {/* Os inputs ficam fora da leitura de tela: quem é lido é o botão. */}
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept={ATTACHMENT_ACCEPT}
                        aria-label="Enviar arquivo"
                        aria-hidden="true"
                        tabIndex={-1}
                        className="sr-only"
                        onChange={(e) => void send(e)}
                    />
                    <input
                        ref={cameraInput}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        aria-label="Tirar foto"
                        aria-hidden="true"
                        tabIndex={-1}
                        className="sr-only"
                        onChange={(e) => void send(e)}
                    />
                </div>
            )}
        </AreaFrame>
    );
}

function AttachmentRow({
    transactionId,
    attachment,
}: {
    transactionId: string;
    attachment: FinanceAttachment;
}) {
    const open = useOpenFinanceAttachment(transactionId);
    const remove = useDeleteFinanceAttachment(transactionId);
    const [confirming, setConfirming] = useState(false);
    const name = attachment.originalName;
    const Icon = attachment.mimeType.startsWith('image/') ? Image : FileText;

    return (
        <li className="flex items-center gap-2 py-2 first:pt-0 last:pb-0">
            <Icon
                className="size-4 shrink-0 text-ds-content-secondary"
                aria-hidden="true"
            />
            <button
                type="button"
                aria-label={`Abrir ${name}`}
                disabled={open.isPending}
                onClick={() => open.open(attachment.id)}
                className="min-w-0 flex-1 cursor-pointer text-left disabled:cursor-wait"
            >
                <span className="block truncate text-ds-body-sm text-ds-content-brand underline-offset-2 hover:underline ds-dark:text-ds-primary-60">
                    {name}
                </span>
                <span className="block text-ds-caption text-ds-content-secondary">
                    {formatFileSize(attachment.size)}
                </span>
            </button>
            {confirming ? (
                <div className="flex shrink-0 items-center gap-1">
                    <DsButton
                        variant="destructive-tertiary"
                        size="sm"
                        label="Remover"
                        aria-label={`Confirmar remover ${name}`}
                        loading={remove.isPending}
                        onClick={() =>
                            remove.mutate(attachment.id, {
                                onSettled: () => setConfirming(false),
                            })
                        }
                    />
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        label="Cancelar"
                        disabled={remove.isPending}
                        onClick={() => setConfirming(false)}
                    />
                </div>
            ) : (
                <DsButton
                    variant="destructive-tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<Trash2 />}
                    label={`Remover ${name}`}
                    onClick={() => setConfirming(true)}
                />
            )}
        </li>
    );
}
