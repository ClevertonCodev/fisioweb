import { Edit2, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useSendQuestionnaire } from '@/application/clinic/use-patient-questionnaires';
import { useQuestionnaireTemplates } from '@/application/clinic/use-questionnaire-templates';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import type { QuestionnaireTemplate } from '@/domain/clinic';

export interface QuestionnaireFormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    patientRecordPath: string;
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
}: QuestionnaireFormSheetProps) {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);
    const [selectedTemplate, setSelectedTemplate] = useState<QuestionnaireTemplate | null>(null);
    const [modality, setModality] = useState<'presencial' | 'remoto'>('presencial');
    const [expiresLocal, setExpiresLocal] = useState('');

    const { data: templates = [], isLoading: loadingTemplates } = useQuestionnaireTemplates();
    const { mutateAsync, isPending } = useSendQuestionnaire(patientId);

    const resetState = useCallback(() => {
        setStep(1);
        setSelectedTemplate(null);
        setModality('presencial');
        setExpiresLocal('');
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
            await mutateAsync({
                questionnaireTemplateId: selectedTemplate.id,
                modality,
                expiresAt,
            });
            handleOpenChange(false);
        } catch {
            // feedback via hook onError
        }
    }, [selectedTemplate, modality, expiresLocal, mutateAsync, handleOpenChange]);

    const returnTo = encodeURIComponent(patientRecordPath + '?tab=questionnaires');

    const goToNewTemplate = () => {
        handleOpenChange(false);
        navigate(`/clinica/questionarios/novo?returnTo=${returnTo}`);
    };

    const goToEditTemplate = (template: QuestionnaireTemplate) => {
        handleOpenChange(false);
        navigate(`/clinica/questionarios/${template.id}/editar?returnTo=${returnTo}`);
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
                        {step === 1 ? 'Selecionar questionário' : 'Configurar envio'}
                    </SheetTitle>
                    <SheetDescription>
                        {step === 1
                            ? 'Escolha um questionário já criado ou crie um novo.'
                            : `Questionário: ${selectedTemplate?.title}`}
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
                                <p className="text-muted-foreground py-4 text-center text-sm">
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
                                                    : 'hover:bg-muted/50 cursor-pointer'
                                            }`}
                                            onClick={() => setSelectedTemplate(t)}
                                        >
                                            <div>
                                                <p className="text-sm font-medium">{t.title}</p>
                                                {t.description && (
                                                    <p className="text-muted-foreground text-xs">
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
                                <RadioGroup
                                    value={modality}
                                    onValueChange={(v) => setModality(v as 'presencial' | 'remoto')}
                                    className="flex flex-wrap gap-4"
                                    disabled={isPending}
                                >
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="presencial" id="q-mod-presencial" />
                                        <Label htmlFor="q-mod-presencial" className="font-normal">
                                            Presencial
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <RadioGroupItem value="remoto" id="q-mod-remoto" />
                                        <Label htmlFor="q-mod-remoto" className="font-normal">
                                            Remoto
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="q-expires">Data de expiração (opcional)</Label>
                                <input
                                    id="q-expires"
                                    type="datetime-local"
                                    value={expiresLocal}
                                    onChange={(e) => setExpiresLocal(e.target.value)}
                                    disabled={isPending}
                                    className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
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
                    ) : (
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
                    )}
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
