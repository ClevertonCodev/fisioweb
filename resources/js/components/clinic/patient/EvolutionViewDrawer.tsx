import { AlertTriangle, Printer } from 'lucide-react';
import { useState } from 'react';

import { openEvolutionPdfInNewTab } from '@/application/clinic/use-evolutions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { PatientEvolution } from '@/domain/clinic';

/** Formato gerado pelo backend: blocos separados por linha em branco; primeira linha `**Título da seção:**`. */
function EvolutionGeneratedText({ text }: { text: string | null }) {
    const raw = text?.trim() ?? '';
    if (!raw) {
        return (
            <p className="text-sm text-muted-foreground">
                Sem texto principal preenchido.
            </p>
        );
    }

    const blocks = raw.split(/\n\n+/);

    return (
        <div className="space-y-4 text-sm leading-relaxed">
            {blocks.map((block, bi) => {
                const lines = block.split('\n');
                const firstLine = (lines[0] ?? '').trim();
                const sectionMatch = /^\*\*(.+?):\*\*$/.exec(firstLine);
                if (sectionMatch) {
                    const sectionTitle = sectionMatch[1];
                    const bodyLines = lines
                        .slice(1)
                        .map((l) => l.trim())
                        .filter(Boolean);
                    return (
                        <div key={bi} className="space-y-2">
                            <p className="font-semibold text-foreground">
                                {sectionTitle}
                            </p>
                            {bodyLines.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">
                                    —
                                </p>
                            ) : (
                                bodyLines.map((line, li) => (
                                    <p
                                        key={li}
                                        className="text-muted-foreground"
                                    >
                                        {line}
                                    </p>
                                ))
                            )}
                        </div>
                    );
                }
                return (
                    <p
                        key={bi}
                        className="whitespace-pre-wrap text-muted-foreground"
                    >
                        {block}
                    </p>
                );
            })}
        </div>
    );
}

export interface EvolutionViewDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientName: string;
    evolution: PatientEvolution | null;
    /** Usado no banner de rascunho — abre o formulário de edição. */
    onEditDraft?: () => void;
}

export function EvolutionViewDrawer({
    open,
    onOpenChange,
    patientName,
    evolution,
    onEditDraft,
}: EvolutionViewDrawerProps) {
    const [printing, setPrinting] = useState(false);

    if (!evolution) {
        return null;
    }

    const dateLabel = new Date(evolution.createdAt).toLocaleDateString(
        'pt-BR',
        {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        },
    );

    const handlePrint = async () => {
        setPrinting(true);
        try {
            await openEvolutionPdfInNewTab(String(evolution.id));
        } finally {
            setPrinting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
            >
                <SheetHeader className="border-b px-6 py-4 text-left">
                    <SheetTitle className="pr-8 text-base leading-snug">
                        {evolution.title?.trim() || 'Evolução'}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                        Visualização da evolução
                    </SheetDescription>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>{patientName}</p>
                        <p>{dateLabel}</p>
                        {evolution.status === 'signed' &&
                        evolution.clinicUser?.name ? (
                            <p>
                                Assinado por{' '}
                                <span className="font-medium text-foreground">
                                    {evolution.clinicUser.name}
                                </span>
                            </p>
                        ) : null}
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1">
                    <div className="space-y-5 px-6 py-4">
                        {evolution.status === 'draft' ? (
                            <Alert className="border-amber-500/50 bg-amber-50 dark:border-amber-600/50 dark:bg-amber-950/30">
                                <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                                <AlertTitle className="text-amber-900 dark:text-amber-100">
                                    Rascunho — não assinado
                                </AlertTitle>
                                <AlertDescription className="text-amber-900/90 dark:text-amber-100/90">
                                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <span className="text-sm">
                                            Assine quando o conteúdo estiver
                                            finalizado.
                                        </span>
                                        {onEditDraft ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                className="cursor-pointer border border-amber-700/40 text-amber-950 hover:bg-amber-100 dark:border-amber-400/40 dark:text-amber-50 dark:hover:bg-amber-900/40"
                                                onClick={() => onEditDraft()}
                                            >
                                                Editar rascunho
                                            </Button>
                                        ) : null}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <EvolutionGeneratedText
                            text={evolution.generatedText}
                        />

                        {evolution.notes?.trim() ? (
                            <div className="space-y-1 border-t border-border pt-4">
                                <p className="text-sm font-semibold text-foreground">
                                    Observações:
                                </p>
                                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                    {evolution.notes.trim()}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </ScrollArea>

                <SheetFooter className="mt-auto border-t px-6 py-4">
                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer gap-2"
                            disabled={printing}
                            onClick={() => void handlePrint()}
                        >
                            <Printer className="h-4 w-4" />
                            {printing ? 'Abrindo…' : 'Imprimir'}
                        </Button>
                        <Button
                            type="button"
                            className="cursor-pointer"
                            onClick={() => onOpenChange(false)}
                        >
                            Fechar
                        </Button>
                    </div>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
