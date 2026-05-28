import { Calendar, CheckSquare, List, Minus, Type } from 'lucide-react';

import { usePatientQuestionnaire } from '@/application/clinic/use-patient-questionnaires';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import type { PatientQuestionnaire } from '@/domain/clinic';

interface QuestionnaireViewSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patientId: string;
    questionnaire: PatientQuestionnaire | null;
}

function QuestionIcon({ type }: { type: string }) {
    switch (type) {
        case 'multiple_choice':
            return <List className="h-3.5 w-3.5" />;
        case 'checkbox':
            return <CheckSquare className="h-3.5 w-3.5" />;
        case 'scale':
            return <Minus className="h-3.5 w-3.5" />;
        default:
            return <Type className="h-3.5 w-3.5" />;
    }
}

function formatAnswer(answer: string | string[] | null): string {
    if (answer === null || answer === undefined) return '—';
    if (Array.isArray(answer)) return answer.length > 0 ? answer.join(', ') : '—';
    return String(answer) || '—';
}

export function QuestionnaireViewSheet({
    open,
    onOpenChange,
    patientId,
    questionnaire,
}: QuestionnaireViewSheetProps) {
    const questionnaireId = questionnaire ? String(questionnaire.id) : null;

    const { data: detail, isLoading } = usePatientQuestionnaire(patientId, questionnaireId);

    const answerMap = new Map(
        (detail?.answers ?? []).map((a) => [a.questionnaireQuestionId, a.answer]),
    );

    const statusLabel =
        questionnaire?.status === 'answered'
            ? 'Respondido'
            : questionnaire?.status === 'expired'
              ? 'Expirado'
              : 'Pendente';

    const statusVariant =
        questionnaire?.status === 'answered'
            ? 'default'
            : questionnaire?.status === 'expired'
              ? 'destructive'
              : 'secondary';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>{questionnaire?.template?.title ?? 'Questionário'}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                        {questionnaire?.answeredAt && (
                            <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                <Calendar className="h-3 w-3" />
                                Respondido em{' '}
                                {new Date(questionnaire.answeredAt).toLocaleDateString('pt-BR')}
                            </span>
                        )}
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-1 px-1 py-4">
                    {isLoading && (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    )}

                    {!isLoading && detail?.template?.sections && (
                        <div className="space-y-6">
                            {detail.template.sections
                                .slice()
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((section) => (
                                    <div key={section.id}>
                                        <h3 className="text-foreground mb-3 text-sm font-semibold">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-4">
                                            {section.questions
                                                .slice()
                                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                                .map((question) => {
                                                    const answer = answerMap.get(question.id);
                                                    const hasAnswer =
                                                        answer !== undefined && answer !== null;
                                                    return (
                                                        <div
                                                            key={question.id}
                                                            className="rounded-md border p-3"
                                                        >
                                                            <div className="text-muted-foreground mb-1.5 flex items-start gap-1.5">
                                                                <QuestionIcon type={question.type} />
                                                                <p className="text-xs">
                                                                    {question.label}
                                                                    {question.required && (
                                                                        <span className="text-destructive ml-1">
                                                                            *
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            <p
                                                                className={
                                                                    hasAnswer
                                                                        ? 'text-foreground text-sm font-medium'
                                                                        : 'text-muted-foreground text-sm italic'
                                                                }
                                                            >
                                                                {formatAnswer(answer ?? null)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {!isLoading && !detail?.template?.sections && (
                        <p className="text-muted-foreground text-sm">
                            Não foi possível carregar as perguntas deste questionário.
                        </p>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
