import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useSendQuestionnaire } from '@/application/clinic/use-patient-questionnaires';
import { useQuestionnaireTemplates } from '@/application/clinic/use-questionnaire-templates';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { SelectOption } from '@/components/ui/select-options';
import { SelectOptions } from '@/components/ui/select-options';

export interface SendQuestionnaireModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
}

function datetimeLocalToExpiresApi(raw: string): string | undefined {
    const s = raw.trim();
    if (!s) return undefined;
    const normalized = s.length === 16 ? `${s}:00` : s;
    return normalized.replace('T', ' ');
}

export function SendQuestionnaireModal({
    open,
    onOpenChange,
    patientId,
}: SendQuestionnaireModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<SelectOption | null>(null);
    const [modality, setModality] = useState<'presencial' | 'remoto'>('presencial');
    const [expiresLocal, setExpiresLocal] = useState('');

    const { data: templates = [], isLoading: loadingTemplates } = useQuestionnaireTemplates();
    const { mutateAsync, isPending } = useSendQuestionnaire(patientId);

    const templateOptions = useMemo(
        () => templates.map((t) => ({ label: t.title, value: String(t.id) })),
        [templates],
    );

    const resetLocalState = useCallback(() => {
        setSelectedTemplate(null);
        setModality('presencial');
        setExpiresLocal('');
    }, []);

    const handleOpenChange = useCallback(
        (next: boolean) => {
            onOpenChange(next);
            if (!next) resetLocalState();
        },
        [onOpenChange, resetLocalState],
    );

    const handleSubmit = useCallback(async () => {
        if (!selectedTemplate) {
            toast.error('Selecione um questionário na lista.');
            return;
        }
        const expiresAt = datetimeLocalToExpiresApi(expiresLocal);
        try {
            await mutateAsync({
                questionnaireTemplateId: Number(selectedTemplate.value),
                modality,
                expiresAt,
            });
            handleOpenChange(false);
        } catch {
            // feedback via useSendQuestionnaire onError
        }
    }, [selectedTemplate, expiresLocal, modality, mutateAsync, handleOpenChange]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Enviar questionário ao paciente</DialogTitle>
                    <DialogDescription>
                        Escolha o questionário, a modalidade e, se quiser, uma data de expiração.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>Questionário</Label>
                        {loadingTemplates ? (
                            <p className="text-muted-foreground text-sm">Carregando questionários…</p>
                        ) : templates.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Nenhum questionário cadastrado.{' '}
                                <a href="/clinica/questionarios" className="text-primary underline">
                                    Criar questionário
                                </a>
                            </p>
                        ) : (
                            <SelectOptions
                                value={selectedTemplate}
                                onChange={setSelectedTemplate}
                                options={templateOptions}
                                placeholder="Buscar questionário…"
                                searchable
                                disabled={isPending}
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Modalidade</Label>
                        <RadioGroup
                            value={modality}
                            onValueChange={(v) => setModality(v as 'presencial' | 'remoto')}
                            className="flex flex-wrap gap-4"
                            disabled={isPending}
                        >
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="presencial" id="send-q-mod-presencial" />
                                <Label htmlFor="send-q-mod-presencial" className="font-normal">
                                    Presencial
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <RadioGroupItem value="remoto" id="send-q-mod-remoto" />
                                <Label htmlFor="send-q-mod-remoto" className="font-normal">
                                    Remoto
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="send-q-expires">Data de expiração (opcional)</Label>
                        <input
                            id="send-q-expires"
                            type="datetime-local"
                            value={expiresLocal}
                            onChange={(e) => setExpiresLocal(e.target.value)}
                            disabled={isPending}
                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        disabled={!selectedTemplate || isPending || loadingTemplates}
                        onClick={() => void handleSubmit()}
                    >
                        {isPending ? 'Enviando…' : 'Enviar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
