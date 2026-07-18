import {
    Check,
    CheckCircle2,
    Copy,
    Loader2,
    Mail,
    MessageCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { Program } from '@/domain/clinic';

export type ProgramSharePhase = 'saving' | 'ready' | 'error';

interface ProgramShareDialogProps {
    open: boolean;
    phase: ProgramSharePhase;
    program: Program | null;
    errorMessage?: string | null;
    onOpenChange: (open: boolean) => void;
    onDone: () => void;
}

function digitsOnly(phone: string): string {
    return phone.replace(/\D/g, '');
}

function buildWhatsAppUrl(program: Program): string | null {
    const phone = program.patientPhone ? digitsOnly(program.patientPhone) : '';
    if (!phone) return null;

    const link = program.shareUrl ?? '';
    const body = [
        `Olá${program.patientName ? `, ${program.patientName}` : ''}!`,
        `Seu programa de tratamento "${program.title}" já está disponível.`,
        program.message?.trim() ? program.message.trim() : null,
        link ? `Acesse: ${link}` : null,
    ]
        .filter(Boolean)
        .join('\n\n');

    return `https://wa.me/${phone}?text=${encodeURIComponent(body)}`;
}

function buildMailtoUrl(program: Program): string | null {
    const email = program.patientEmail?.trim();
    if (!email) return null;

    const link = program.shareUrl ?? '';
    const subject = `Programa de tratamento: ${program.title}`;
    const body = [
        `Olá${program.patientName ? `, ${program.patientName}` : ''}!`,
        `Seu programa de tratamento "${program.title}" já está disponível.`,
        program.message?.trim() ? program.message.trim() : null,
        link ? `Acesse: ${link}` : null,
    ]
        .filter(Boolean)
        .join('\n\n');

    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ProgramShareDialog({
    open,
    phase,
    program,
    errorMessage,
    onOpenChange,
    onDone,
}: ProgramShareDialogProps) {
    const [copied, setCopied] = useState(false);
    const whatsappUrl = program ? buildWhatsAppUrl(program) : null;
    const mailtoUrl = program ? buildMailtoUrl(program) : null;
    const shareUrl = program?.shareUrl ?? null;

    // Ajuste durante o render em vez de efeito: reseta o "copiado" ao fechar.
    const [wasOpen, setWasOpen] = useState(open);
    if (wasOpen !== open) {
        setWasOpen(open);
        if (!open) setCopied(false);
    }

    async function handleCopyLink() {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('Link copiado');
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Não foi possível copiar o link');
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full min-w-0 overflow-hidden sm:max-w-md">
                {phase === 'saving' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Salvando programa</DialogTitle>
                            <DialogDescription>
                                Aguarde enquanto o programa é salvo e enviado
                                para o paciente.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-3 py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">
                                Salvando no servidor...
                            </p>
                        </div>
                    </>
                )}

                {phase === 'error' && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Não foi possível salvar</DialogTitle>
                            <DialogDescription>
                                {errorMessage ??
                                    'Ocorreu um erro ao salvar o programa. Tente novamente.'}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                className="cursor-pointer"
                                onClick={() => onOpenChange(false)}
                            >
                                Fechar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {phase === 'ready' && program && (
                    <>
                        <DialogHeader className="min-w-0 pr-6">
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                                Programa salvo
                            </DialogTitle>
                            <DialogDescription>
                                O programa{' '}
                                <span className="font-medium text-foreground">
                                    {program.title}
                                </span>
                                {program.patientName
                                    ? ` foi enviado para ${program.patientName}.`
                                    : ' foi salvo.'}{' '}
                                Escolha como compartilhar o acesso:
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex min-w-0 flex-col gap-2 py-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto w-full min-w-0 cursor-pointer justify-start gap-3 px-3 py-2.5 whitespace-normal"
                                disabled={!whatsappUrl}
                                onClick={() => {
                                    if (whatsappUrl) {
                                        window.open(
                                            whatsappUrl,
                                            '_blank',
                                            'noopener,noreferrer',
                                        );
                                    }
                                }}
                            >
                                <MessageCircle
                                    className={`h-5 w-5 shrink-0 ${whatsappUrl ? 'text-primary' : 'text-muted-foreground'}`}
                                />
                                <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                                    <span className="text-sm font-medium">
                                        WhatsApp Web
                                    </span>
                                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                                        {whatsappUrl
                                            ? (program.patientPhone ??
                                              'Telefone cadastrado')
                                            : 'Paciente sem telefone cadastrado'}
                                    </span>
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto w-full min-w-0 cursor-pointer justify-start gap-3 px-3 py-2.5 whitespace-normal"
                                disabled={!mailtoUrl}
                                onClick={() => {
                                    if (mailtoUrl) {
                                        window.location.href = mailtoUrl;
                                    }
                                }}
                            >
                                <Mail
                                    className={`h-5 w-5 shrink-0 ${mailtoUrl ? 'text-primary' : 'text-muted-foreground'}`}
                                />
                                <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                                    <span className="text-sm font-medium">
                                        E-mail
                                    </span>
                                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                                        {mailtoUrl
                                            ? program.patientEmail
                                            : 'Paciente sem e-mail cadastrado'}
                                    </span>
                                </span>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-auto w-full min-w-0 cursor-pointer justify-start gap-3 px-3 py-2.5 whitespace-normal"
                                disabled={!shareUrl}
                                onClick={handleCopyLink}
                            >
                                {copied ? (
                                    <Check className="h-5 w-5 shrink-0 text-primary" />
                                ) : (
                                    <Copy className="h-5 w-5 shrink-0 text-primary" />
                                )}
                                <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                                    <span className="text-sm font-medium">
                                        {copied
                                            ? 'Link copiado'
                                            : 'Copiar link'}
                                    </span>
                                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                                        {shareUrl ??
                                            'Link de acesso indisponível'}
                                    </span>
                                </span>
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button className="cursor-pointer" onClick={onDone}>
                                Concluir
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
