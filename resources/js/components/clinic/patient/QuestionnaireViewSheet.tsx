import { Calendar, CheckSquare, List, Minus, Type } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
    useAnswerQuestionnaire,
    usePatientQuestionnaire,
} from '@/application/clinic/use-patient-questionnaires';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
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
import { Textarea } from '@/components/ui/textarea';
import type {
    PatientQuestionnaire,
    QuestionnaireQuestion,
} from '@/domain/clinic';

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
    if (Array.isArray(answer))
        return answer.length > 0 ? answer.join(', ') : '—';
    return String(answer) || '—';
}

type AnswerDraft = string | string[];

export function QuestionnaireViewSheet({
    open,
    onOpenChange,
    patientId,
    questionnaire,
}: QuestionnaireViewSheetProps) {
    const questionnaireId = questionnaire ? String(questionnaire.id) : null;
    const canAnswer =
        questionnaire?.status === 'pending' &&
        questionnaire?.modality === 'presencial';

    const { data: detail, isLoading } = usePatientQuestionnaire(
        patientId,
        questionnaireId,
    );
    const answerMutation = useAnswerQuestionnaire(patientId);

    const [drafts, setDrafts] = useState<Record<number, AnswerDraft>>({});

    useEffect(() => {
        if (!open || !detail) return;
        const next: Record<number, AnswerDraft> = {};
        for (const a of detail.answers ?? []) {
            if (a.answer === null || a.answer === undefined) continue;
            next[a.questionnaireQuestionId] = Array.isArray(a.answer)
                ? a.answer
                : String(a.answer);
        }
        setDrafts(next);
    }, [open, detail]);

    const answerMap = useMemo(
        () =>
            new Map(
                (detail?.answers ?? []).map((a) => [
                    a.questionnaireQuestionId,
                    a.answer,
                ]),
            ),
        [detail?.answers],
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

    const setDraft = (questionId: number, value: AnswerDraft) => {
        setDrafts((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        if (!questionnaire || !detail?.template?.sections) return;

        const questions = detail.template.sections.flatMap((s) => s.questions);
        for (const q of questions) {
            if (!q.required) continue;
            const value = drafts[q.id];
            const empty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                (Array.isArray(value) && value.length === 0);
            if (empty) {
                toast.error(`Preencha: ${q.label}`);
                return;
            }
        }

        const answers = questions
            .map((q) => {
                const value = drafts[q.id];
                if (value === undefined || value === null) return null;
                if (typeof value === 'string' && value.trim() === '')
                    return null;
                if (Array.isArray(value) && value.length === 0) return null;
                return {
                    questionId: q.id,
                    answer:
                        q.type === 'scale' && typeof value === 'string'
                            ? Number(value)
                            : value,
                };
            })
            .filter((a): a is NonNullable<typeof a> => a !== null);

        try {
            await answerMutation.mutateAsync({
                questionnaireId: String(questionnaire.id),
                answers,
            });
            onOpenChange(false);
        } catch {
            // toast via hook
        }
    };

    const renderEditableQuestion = (question: QuestionnaireQuestion) => {
        const value = drafts[question.id];

        if (question.type === 'text') {
            return (
                <Textarea
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => setDraft(question.id, e.target.value)}
                    placeholder="Escreva a resposta"
                    className="mt-2"
                    disabled={answerMutation.isPending}
                />
            );
        }

        if (question.type === 'scale') {
            const min = question.scaleMin ?? 0;
            const max = question.scaleMax ?? 10;
            return (
                <Input
                    type="number"
                    min={min}
                    max={max}
                    value={typeof value === 'string' ? value : ''}
                    onChange={(e) => setDraft(question.id, e.target.value)}
                    placeholder={`${min}–${max}`}
                    className="mt-2"
                    disabled={answerMutation.isPending}
                />
            );
        }

        if (question.type === 'multiple_choice') {
            const options = question.options ?? [];
            return (
                <RadioGroup
                    value={typeof value === 'string' ? value : ''}
                    onValueChange={(v) => setDraft(question.id, v)}
                    className="mt-2 space-y-2"
                    disabled={answerMutation.isPending}
                >
                    {options.map((opt) => (
                        <div key={opt} className="flex items-center gap-2">
                            <RadioGroupItem
                                value={opt}
                                id={`q-${question.id}-${opt}`}
                            />
                            <Label
                                htmlFor={`q-${question.id}-${opt}`}
                                className="font-normal"
                            >
                                {opt}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>
            );
        }

        if (question.type === 'checkbox') {
            const options = question.options ?? [];
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="mt-2 space-y-2">
                    {options.map((opt) => {
                        const checked = selected.includes(opt);
                        return (
                            <div key={opt} className="flex items-center gap-2">
                                <Checkbox
                                    id={`q-${question.id}-${opt}`}
                                    checked={checked}
                                    disabled={answerMutation.isPending}
                                    onCheckedChange={(state) => {
                                        const on = state === true;
                                        setDraft(
                                            question.id,
                                            on
                                                ? [...selected, opt]
                                                : selected.filter(
                                                      (v) => v !== opt,
                                                  ),
                                        );
                                    }}
                                />
                                <Label
                                    htmlFor={`q-${question.id}-${opt}`}
                                    className="font-normal"
                                >
                                    {opt}
                                </Label>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>
                        {questionnaire?.template?.title ?? 'Questionário'}
                    </SheetTitle>
                    <SheetDescription className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                        {questionnaire?.modality && (
                            <Badge variant="outline">
                                {questionnaire.modality}
                            </Badge>
                        )}
                        {questionnaire?.answeredAt && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                Respondido em{' '}
                                {new Date(
                                    questionnaire.answeredAt,
                                ).toLocaleDateString('pt-BR')}
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

                    {!isLoading &&
                        questionnaire?.status === 'pending' &&
                        questionnaire.modality === 'remoto' && (
                            <p className="mb-4 text-sm text-muted-foreground">
                                Questionário remoto pendente — o paciente
                                responde pelo link enviado.
                            </p>
                        )}

                    {!isLoading && detail?.template?.sections && (
                        <div className="space-y-6">
                            {detail.template.sections
                                .slice()
                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                .map((section) => (
                                    <div key={section.id}>
                                        <h3 className="mb-3 text-sm font-semibold text-foreground">
                                            {section.title}
                                        </h3>
                                        <div className="space-y-4">
                                            {section.questions
                                                .slice()
                                                .sort(
                                                    (a, b) =>
                                                        a.sortOrder -
                                                        b.sortOrder,
                                                )
                                                .map((question) => {
                                                    const answer =
                                                        answerMap.get(
                                                            question.id,
                                                        );
                                                    const hasAnswer =
                                                        answer !== undefined &&
                                                        answer !== null;
                                                    return (
                                                        <div
                                                            key={question.id}
                                                            className="rounded-md border p-3"
                                                        >
                                                            <div className="mb-1.5 flex items-start gap-1.5 text-muted-foreground">
                                                                <QuestionIcon
                                                                    type={
                                                                        question.type
                                                                    }
                                                                />
                                                                <p className="text-xs">
                                                                    {
                                                                        question.label
                                                                    }
                                                                    {question.required && (
                                                                        <span className="ml-1 text-destructive">
                                                                            *
                                                                        </span>
                                                                    )}
                                                                </p>
                                                            </div>
                                                            {canAnswer ? (
                                                                renderEditableQuestion(
                                                                    question,
                                                                )
                                                            ) : (
                                                                <p
                                                                    className={
                                                                        hasAnswer
                                                                            ? 'text-sm font-medium text-foreground'
                                                                            : 'text-sm text-muted-foreground italic'
                                                                    }
                                                                >
                                                                    {formatAnswer(
                                                                        answer ??
                                                                            null,
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {!isLoading && !detail?.template?.sections && (
                        <p className="text-sm text-muted-foreground">
                            Não foi possível carregar as perguntas deste
                            questionário.
                        </p>
                    )}
                </ScrollArea>

                {canAnswer && (
                    <SheetFooter className="gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={answerMutation.isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={answerMutation.isPending}
                        >
                            {answerMutation.isPending
                                ? 'Salvando…'
                                : 'Salvar respostas'}
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}
