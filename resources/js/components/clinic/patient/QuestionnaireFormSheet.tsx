import {
    Check,
    CheckCircle2,
    Copy,
    Edit2,
    Mail,
    MessageCircle,
    Plus,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useSendQuestionnaire } from '@/application/clinic/use-patient-questionnaires';
import { useQuestionnaireTemplates } from '@/application/clinic/use-questionnaire-templates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type {
    PatientQuestionnaire,
    QuestionnaireTemplate,
} from '@/domain/clinic';
import {
    buildMailtoUrl,
    buildWhatsAppUrl,
    questionnaireShareText,
} from '@/pages/clinic/patient/patient-record/share';

export interface QuestionnaireFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientRecordPath: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
}

function datetimeLocalToApi(raw: string): string | undefined {
    const s = raw.trim();
    if (!s) return undefined;
    return (s.length === 16 ? `${s}:00` : s).replace('T', ' ');
}

export function QuestionnaireFormSheet({
    open,
    onOpenChange,
    patientId,
    patientRecordPath,
    patientName,
    patientPhone,
    patientEmail,
}: QuestionnaireFormSheetProps) {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedTemplate, setSelectedTemplate] =
        useState<QuestionnaireTemplate | null>(null);
    const [modality, setModality] = useState<'presencial' | 'remoto'>(
        'presencial',
    );
    const [expiresLocal, setExpiresLocal] = useState('');
    const [sent, setSent] = useState<PatientQuestionnaire | null>(null);
    const [copied, setCopied] = useState(false);

    const { data: templates = [], isLoading: loadingTemplates } =
        useQuestionnaireTemplates();
    const { mutateAsync, isPending } = useSendQuestionnaire(patientId);

    const resetState = useCallback(() => {
        setStep(1);
        setSelectedTemplate(null);
        setModality('presencial');
        setExpiresLocal('');
        setSent(null);
        setCopied(false);
    }, []);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            onOpenChange(next);
            if (!next) resetState();
        },
        [onOpenChange, resetState],
    );

    const handleSend = useCallback(async () => {
        if (!selectedTemplate) return;
        const expiresAt = datetimeLocalToApi(expiresLocal);
        try {
            const created = await mutateAsync({
                questionnaireTemplateId: selectedTemplate.id,
                modality,
                expiresAt,
            });
            setSent(created);
            setStep(3);
        } catch {
            // feedback via hook onError
        }
    }, [selectedTemplate, modality, expiresLocal, mutateAsync]);

    const returnTo = encodeURIComponent(
        patientRecordPath + '?tab=questionnaires',
    );

    const goToNewTemplate = () => {
        handleOpenChange(false);
        navigate(`/clinica/questionarios/novo?returnTo=${returnTo}`);
    };

    const goToEditTemplate = (template: QuestionnaireTemplate) => {
        handleOpenChange(false);
        navigate(
            `/clinica/questionarios/${template.id}/editar?returnTo=${returnTo}`,
        );
    };

    const sortedTemplates = useMemo(
        () => [...templates].sort((a, b) => a.title.localeCompare(b.title)),
        [templates],
    );

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        {step === 1
                            ? 'Selecionar questionário'
                            : step === 2
                              ? 'Configurar envio'
                              : 'Pronto'}
                    </SheetTitle>
                    <SheetDescription>
                        {step === 1
                            ? 'Escolha um questionário já criado ou crie um novo.'
                            : step === 2
                              ? `Questionário: ${selectedTemplate?.title}`
                              : 'Envie o link ao paciente. O endereço leva o token, não o id.'}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-1">
                    {/* ── STEP 1 ── */}
                    {step === 1 && (
                        <div className="space-y-3 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start gap-2"
                                onClick={goToNewTemplate}
                            >
                                <Plus className="h-4 w-4" />
                                Criar novo questionário
                            </Button>

                            {loadingTemplates ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : sortedTemplates.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">
                                    Nenhum questionário cadastrado ainda.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {sortedTemplates.map((t) => (
                                        <div
                                            key={t.id}
                                            className={`flex items-center justify-between rounded-md border p-3 transition-colors ${
                                                selectedTemplate?.id === t.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'cursor-pointer hover:bg-muted/50'
                                            }`}
                                            onClick={() =>
                                                setSelectedTemplate(t)
                                            }
                                        >
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {t.title}
                                                </p>
                                                {t.description && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {t.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    goToEditTemplate(t);
                                                }}
                                                title="Editar questionário"
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── STEP 2 ── */}
                    {step === 2 && (
                        <div className="space-y-5 py-4">
                            <div className="space-y-2">
                                <Label>Modalidade</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        type="button"
                                        variant={
                                            modality === 'presencial'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="cursor-pointer"
                                        disabled={isPending}
                                        onClick={() =>
                                            setModality('presencial')
                                        }
                                    >
                                        Presencial
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            modality === 'remoto'
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="cursor-pointer"
                                        disabled={isPending}
                                        onClick={() => setModality('remoto')}
                                    >
                                        Remoto
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="q-expires">
                                    Data de expiração (opcional)
                                </Label>
                                <input
                                    id="q-expires"
                                    type="datetime-local"
                                    value={expiresLocal}
                                    onChange={(e) =>
                                        setExpiresLocal(e.target.value)
                                    }
                                    disabled={isPending}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    )}

                    {step === 3 && sent && (
                        <QuestionnaireReadyStep
                            sent={sent}
                            templateTitle={
                                selectedTemplate?.title ??
                                sent.template?.title ??
                                'Questionário'
                            }
                            patientName={patientName}
                            patientPhone={patientPhone}
                            patientEmail={patientEmail}
                            copied={copied}
                            onCopied={() => setCopied(true)}
                        />
                    )}
                </ScrollArea>

                <SheetFooter className="gap-2 pt-4">
                    {step === 1 ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="button"
                                disabled={!selectedTemplate}
                                onClick={() => setStep(2)}
                            >
                                Continuar
                            </Button>
                        </>
                    ) : step === 2 ? (
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => setStep(1)}
                            >
                                Voltar
                            </Button>
                            <Button
                                type="button"
                                disabled={isPending}
                                onClick={() => void handleSend()}
                            >
                                {isPending ? 'Enviando…' : 'Enviar ao paciente'}
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            onClick={() => handleOpenChange(false)}
                        >
                            Concluir
                        </Button>
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

function QuestionnaireReadyStep({
    sent,
    templateTitle,
    patientName,
    patientPhone,
    patientEmail,
    copied,
    onCopied,
}: {
    sent: PatientQuestionnaire;
    templateTitle: string;
    patientName?: string;
    patientPhone?: string;
    patientEmail?: string;
    copied: boolean;
    onCopied: () => void;
}) {
    const shareUrl = sent.shareUrl;
    const text = questionnaireShareText(
        patientName,
        templateTitle,
        shareUrl ?? '',
    );
    const whatsappUrl = buildWhatsAppUrl(patientPhone, text);
    const mailtoUrl = buildMailtoUrl(
        patientEmail,
        `Questionário: ${templateTitle}`,
        text,
    );

    async function handleCopy() {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            onCopied();
            toast.success('Link copiado');
        } catch {
            toast.error('Não foi possível copiar o link');
        }
    }

    return (
        <div className="flex min-w-0 flex-col gap-2 py-4">
            <div className="mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-medium">Questionário enviado</p>
            </div>
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
                    <span className="text-sm font-medium">WhatsApp</span>
                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                        {whatsappUrl
                            ? (patientPhone ?? 'Telefone cadastrado')
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
                    if (mailtoUrl) window.location.href = mailtoUrl;
                }}
            >
                <Mail
                    className={`h-5 w-5 shrink-0 ${mailtoUrl ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">E-mail</span>
                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                        {mailtoUrl
                            ? patientEmail
                            : 'Paciente sem e-mail cadastrado'}
                    </span>
                </span>
            </Button>
            <Button
                type="button"
                variant="outline"
                className="h-auto w-full min-w-0 cursor-pointer justify-start gap-3 px-3 py-2.5 whitespace-normal"
                disabled={!shareUrl}
                onClick={() => void handleCopy()}
            >
                {copied ? (
                    <Check className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                    <Copy className="h-5 w-5 shrink-0 text-primary" />
                )}
                <span className="flex min-w-0 flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">
                        {copied ? 'Link copiado' : 'Copiar link'}
                    </span>
                    <span className="w-full truncate text-xs font-normal text-muted-foreground">
                        {shareUrl ?? 'Link de acesso indisponível'}
                    </span>
                </span>
            </Button>
        </div>
    );
}
