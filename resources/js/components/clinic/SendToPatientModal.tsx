import { isAxiosError } from 'axios';
import { Check, Copy, Link2, Mail, MessageCircle } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { DsBadge, DsButton, DsModal } from '@/components/ds';

export interface SendToPatientModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    meta?: string;
    description?: string;
    patientEmail: string | null;
    patientPhone: string | null;
    whatsappUrl: string | null;
    shareUrl?: string | null;
    dismissLabel?: string;
    onSendEmail: () => Promise<void>;
}

function nowTimeLabel(): string {
    return new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function resolveApiErrorMessage(error: unknown): string {
    const fallback = 'Não foi possível enviar o e-mail. Tente novamente.';
    if (!isAxiosError(error)) return fallback;

    const status = error.response?.status;
    if (status === 422 || status === 429) {
        const message = (error.response?.data as { message?: unknown } | null)
            ?.message;
        if (typeof message === 'string' && message.trim() !== '') {
            return message;
        }
    }

    return fallback;
}

function ChannelRow({
    icon,
    title,
    detail,
    status,
    action,
}: {
    icon: ReactNode;
    title: string;
    detail: string;
    status?: ReactNode;
    action: ReactNode;
}) {
    return (
        <li className="flex items-center gap-3 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle text-ds-content-brand [&_svg]:size-5">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-ds-body-sm font-semibold text-ds-content-primary">
                    {title}
                    {status}
                </p>
                <p className="truncate text-ds-caption text-ds-content-secondary">
                    {detail}
                </p>
            </div>
            {action}
        </li>
    );
}

function SendToPatientModalDialog({
    onClose,
    title = 'Enviar ao paciente',
    meta,
    description,
    patientEmail,
    patientPhone,
    whatsappUrl,
    shareUrl,
    dismissLabel = 'Fechar',
    onSendEmail,
}: Omit<SendToPatientModalProps, 'open'>) {
    const [sending, setSending] = useState(false);
    const [emailSentAt, setEmailSentAt] = useState<string | null>(null);
    const [whatsappOpenedAt, setWhatsappOpenedAt] = useState<string | null>(
        null,
    );
    const [copied, setCopied] = useState(false);
    const mountedRef = useRef(true);

    const email = patientEmail?.trim() || null;
    const phone = patientPhone?.trim() || null;
    const link = shareUrl?.trim() || null;
    const canOpenWhatsApp = Boolean(whatsappUrl && phone);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    async function handleSendEmail() {
        if (!email || sending) return;
        setSending(true);
        try {
            await onSendEmail();
            toast.success(`E-mail enviado para ${email}`);
            if (mountedRef.current) {
                setEmailSentAt(nowTimeLabel());
            }
        } catch (error) {
            toast.error(resolveApiErrorMessage(error));
        } finally {
            if (mountedRef.current) {
                setSending(false);
            }
        }
    }

    async function handleCopyLink() {
        if (!link) return;
        try {
            await navigator.clipboard.writeText(link);
            if (!mountedRef.current) return;
            setCopied(true);
            toast.success('Link copiado');
        } catch {
            if (!mountedRef.current) return;
            toast.error('Não foi possível copiar o link');
        }
    }

    const anySent = emailSentAt !== null || whatsappOpenedAt !== null;

    return (
        <DsModal
            open
            onOpenChange={(isOpen) => {
                if (!isOpen && !sending) onClose();
            }}
            closeOnBackdrop={!sending}
            size="sm"
            title={title}
            meta={meta}
            footer={
                <div className="flex w-full justify-end">
                    <DsButton
                        variant={anySent ? 'primary' : 'tertiary'}
                        label={anySent ? 'Concluir' : dismissLabel}
                        disabled={sending}
                        onClick={onClose}
                    />
                </div>
            }
        >
            <div className="flex flex-col gap-2">
                {description && (
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        {description}
                    </p>
                )}
                <ul className="divide-y divide-ds-border-subtle">
                    <ChannelRow
                        icon={<Mail />}
                        title="E-mail"
                        detail={email ?? 'Paciente sem e-mail cadastrado'}
                        status={
                            emailSentAt && (
                                <DsBadge variant="success">
                                    Enviado {emailSentAt}
                                </DsBadge>
                            )
                        }
                        action={
                            <DsButton
                                size="sm"
                                variant={emailSentAt ? 'secondary' : 'primary'}
                                label={
                                    sending
                                        ? 'Enviando…'
                                        : emailSentAt
                                          ? 'Reenviar'
                                          : 'Enviar'
                                }
                                disabled={!email || sending}
                                onClick={() => void handleSendEmail()}
                            />
                        }
                    />
                    <ChannelRow
                        icon={<MessageCircle />}
                        title="WhatsApp"
                        detail={
                            canOpenWhatsApp
                                ? (phone as string)
                                : 'Paciente sem celular cadastrado'
                        }
                        status={
                            whatsappOpenedAt && (
                                <DsBadge variant="info">
                                    Aberto {whatsappOpenedAt}
                                </DsBadge>
                            )
                        }
                        action={
                            <DsButton
                                size="sm"
                                variant="secondary"
                                label="Abrir"
                                disabled={!canOpenWhatsApp}
                                onClick={() => {
                                    if (!canOpenWhatsApp || !whatsappUrl) {
                                        return;
                                    }
                                    window.open(
                                        whatsappUrl,
                                        '_blank',
                                        'noopener,noreferrer',
                                    );
                                    setWhatsappOpenedAt(nowTimeLabel());
                                }}
                            />
                        }
                    />
                    {link && (
                        <ChannelRow
                            icon={<Link2 />}
                            title="Link"
                            detail={link}
                            action={
                                <DsButton
                                    size="sm"
                                    variant="tertiary"
                                    iconPosition="left"
                                    icon={copied ? <Check /> : <Copy />}
                                    label={copied ? 'Copiado' : 'Copiar'}
                                    onClick={() => void handleCopyLink()}
                                />
                            }
                        />
                    )}
                </ul>
            </div>
        </DsModal>
    );
}

export function SendToPatientModal({
    open,
    ...props
}: SendToPatientModalProps) {
    if (!open) return null;
    const resetKey = `${props.meta ?? ''}|${props.shareUrl ?? ''}`;
    return <SendToPatientModalDialog key={resetKey} {...props} />;
}
