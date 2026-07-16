import {
    Check,
    CheckCircle2,
    Copy,
    Loader2,
    Mail,
    MessageCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const phone = program.patientPhone
        ? digitsOnly(program.patientPhone)
        : '';
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

    useEffect(() => {
        if (!open) setCopied(false);
    }, [open]);

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
            <DialogContent className="sm:max-w-md">
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
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-primary" />
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

                        <div className="space-y-2 py-2">
                            <Button
                                variant="outline"
                                className="h-12 w-full cursor-pointer justify-start gap-3"
                                disabled={!whatsappUrl}
                                asChild={Boolean(whatsappUrl)}
                            >
                                {whatsappUrl ? (
                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MessageCircle className="h-5 w-5 text-primary" />
                                        <span className="flex flex-col items-start">
                                            <span className="text-sm font-medium">
                                                WhatsApp Web
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {program.patientPhone ??
                                                    'Telefone não cadastrado'}
                                            </span>
                                        </span>
                                    </a>
                                ) : (
                                    <>
                                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                        <span className="flex flex-col items-start">
                                            <span className="text-sm font-medium">
                                                WhatsApp Web
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Paciente sem telefone cadastrado
                                            </span>
                                        </span>
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                className="h-12 w-full cursor-pointer justify-start gap-3"
                                disabled={!mailtoUrl}
                                asChild={Boolean(mailtoUrl)}
                            >
                                {mailtoUrl ? (
                                    <a href={mailtoUrl}>
                                        <Mail className="h-5 w-5 text-primary" />
                                        <span className="flex flex-col items-start">
                                            <span className="text-sm font-medium">
                                                E-mail
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                {program.patientEmail}
                                            </span>
                                        </span>
                                    </a>
                                ) : (
                                    <>
                                        <Mail className="h-5 w-5 text-muted-foreground" />
                                        <span className="flex flex-col items-start">
                                            <span className="text-sm font-medium">
                                                E-mail
                                            </span>
                                            <span className="text-xs font-normal text-muted-foreground">
                                                Paciente sem e-mail cadastrado
                                            </span>
                                        </span>
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                className="h-12 w-full cursor-pointer justify-start gap-3"
                                disabled={!shareUrl}
                                onClick={handleCopyLink}
                            >
                                {copied ? (
                                    <Check className="h-5 w-5 text-primary" />
                                ) : (
                                    <Copy className="h-5 w-5 text-primary" />
                                )}
                                <span className="flex flex-col items-start">
                                    <span className="text-sm font-medium">
                                        {copied ? 'Link copiado' : 'Copiar link'}
                                    </span>
                                    <span className="max-w-full truncate text-xs font-normal text-muted-foreground">
                                        {shareUrl ??
                                            'Link de acesso indisponível'}
                                    </span>
                                </span>
                            </Button>
                        </div>

                        <DialogFooter>
                            <Button
                                className="cursor-pointer"
                                onClick={onDone}
                            >
                                Concluir
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
