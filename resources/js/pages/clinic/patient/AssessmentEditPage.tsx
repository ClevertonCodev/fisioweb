import { AlertCircle, Check, ChevronLeft, PenLine, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
    useAssessment,
    useSignAssessment,
    useUpdateAssessment,
} from '@/application/clinic/use-assessments';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import type { AssessmentField, AssessmentSection } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface TextFieldProps {
    field: AssessmentField;
    value: string;
    onChange: (v: string) => void;
    readonly: boolean;
}

function TextField({ field, value, onChange, readonly }: TextFieldProps) {
    if (field.fieldType === 'textarea') {
        return (
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readonly}
                placeholder="Escreva sua resposta aqui"
                className={cn(
                    'min-h-24 resize-none',
                    readonly && 'cursor-default',
                )}
            />
        );
    }
    return (
        <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            readOnly={readonly}
            placeholder="Resposta curta"
            className={cn(readonly && 'cursor-default')}
        />
    );
}

interface NumberFieldProps {
    field: AssessmentField;
    value: string;
    onChange: (v: string) => void;
    readonly: boolean;
}

function NumberField({ field, value, onChange, readonly }: NumberFieldProps) {
    const unit = field.config?.unit;
    return (
        <div className="flex w-full max-w-xs items-center gap-2">
            <Input
                type="number"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                readOnly={readonly}
                placeholder="—"
                className={cn(
                    'min-w-0 flex-1 text-right',
                    readonly && 'cursor-default',
                )}
            />
            {unit && (
                <span className="shrink-0 text-sm text-muted-foreground">
                    {unit}
                </span>
            )}
        </div>
    );
}

interface RangeFieldProps {
    field: AssessmentField;
    value: string;
    onChange: (v: string) => void;
    readonly: boolean;
}

function RangeField({ field, value, onChange, readonly }: RangeFieldProps) {
    const min = field.config?.min ?? 0;
    const max = field.config?.max ?? 10;
    const current = value !== '' ? Number(value) : min;
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">
                    {field.config?.minLabel ?? min}
                </span>
                <div className="min-w-0 flex-1">
                    <Slider
                        value={[current]}
                        onValueChange={([v]) =>
                            !readonly && onChange(String(v))
                        }
                        min={min}
                        max={max}
                        step={1}
                        disabled={readonly}
                    />
                </div>
                <span className="hidden w-20 shrink-0 text-xs text-muted-foreground sm:block">
                    {field.config?.maxLabel ?? max}
                </span>
                <span className="min-w-8 shrink-0 rounded bg-primary/10 px-2 py-0.5 text-center font-mono text-xs text-primary">
                    {current}
                </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
                <span>{field.config?.minLabel ?? min}</span>
                <span>{field.config?.maxLabel ?? max}</span>
            </div>
        </div>
    );
}

interface CheckboxFieldProps {
    field: AssessmentField;
    selectedOptionIds: Set<number>;
    onToggle: (optionId: number) => void;
    readonly: boolean;
}

function CheckboxField({
    field,
    selectedOptionIds,
    onToggle,
    readonly,
}: CheckboxFieldProps) {
    return (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {field.options.map((opt) => {
                const active = selectedOptionIds.has(opt.id);
                return (
                    <button
                        key={opt.id}
                        type="button"
                        disabled={readonly}
                        onClick={() => !readonly && onToggle(opt.id)}
                        className={cn(
                            'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors duration-150',
                            active
                                ? 'border-primary bg-primary/10 font-medium text-primary'
                                : 'border-border bg-background text-foreground',
                            !readonly && 'cursor-pointer hover:bg-accent/50',
                            readonly && 'cursor-default',
                        )}
                    >
                        <span className="min-w-0 flex-1 break-words">
                            {opt.label}
                        </span>
                        {active && (
                            <Check className="h-4 w-4 shrink-0 text-primary" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

interface SectionCardProps {
    section: AssessmentSection;
    answers: Map<number, string>;
    selectedOptions: Map<number, Set<number>>;
    onAnswerChange: (fieldId: number, value: string) => void;
    onOptionToggle: (fieldId: number, optionId: number) => void;
    readonly: boolean;
}

function SectionCard({
    section,
    answers,
    selectedOptions,
    onAnswerChange,
    onOptionToggle,
    readonly,
}: SectionCardProps) {
    return (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="bg-muted px-4 py-3 sm:px-5">
                <h3 className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase sm:text-xs">
                    {section.title}
                </h3>
            </div>
            <div className="space-y-5 p-4 sm:p-5">
                {section.fields.map((field) => (
                    <div key={field.id}>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {field.label}
                            {field.required && (
                                <span className="ml-1 text-destructive">*</span>
                            )}
                        </label>
                        {(field.fieldType === 'textarea' ||
                            field.fieldType === 'text') && (
                            <TextField
                                field={field}
                                value={answers.get(field.id) ?? ''}
                                onChange={(v) => onAnswerChange(field.id, v)}
                                readonly={readonly}
                            />
                        )}
                        {field.fieldType === 'range' && (
                            <RangeField
                                field={field}
                                value={answers.get(field.id) ?? ''}
                                onChange={(v) => onAnswerChange(field.id, v)}
                                readonly={readonly}
                            />
                        )}
                        {field.fieldType === 'number' && (
                            <NumberField
                                field={field}
                                value={answers.get(field.id) ?? ''}
                                onChange={(v) => onAnswerChange(field.id, v)}
                                readonly={readonly}
                            />
                        )}
                        {field.fieldType === 'checkbox' && (
                            <CheckboxField
                                field={field}
                                selectedOptionIds={
                                    selectedOptions.get(field.id) ?? new Set()
                                }
                                onToggle={(optionId) =>
                                    onOptionToggle(field.id, optionId)
                                }
                                readonly={readonly}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AssessmentEditPage() {
    const { id: patientId, assessmentId } = useParams<{
        id: string;
        assessmentId: string;
    }>();
    const navigate = useNavigate();

    const {
        data: assessment,
        isLoading,
        isError,
    } = useAssessment(assessmentId!);
    const updateAssessment = useUpdateAssessment();
    const signAssessment = useSignAssessment(patientId!);

    const [answers, setAnswers] = useState<Map<number, string>>(new Map());
    const [selectedOptions, setSelectedOptions] = useState<
        Map<number, Set<number>>
    >(new Map());

    // Initialize form state from loaded assessment
    useEffect(() => {
        if (!assessment) return;
        const newAnswers = new Map<number, string>();
        for (const a of assessment.answers) {
            if (a.value !== null) newAnswers.set(a.fieldId, a.value);
        }
        const newOptions = new Map<number, Set<number>>();
        for (const o of assessment.answerOptions) {
            const set = newOptions.get(o.fieldId) ?? new Set<number>();
            set.add(o.optionId);
            newOptions.set(o.fieldId, set);
        }
        setAnswers(newAnswers);
        setSelectedOptions(newOptions);
    }, [assessment]);

    function handleAnswerChange(fieldId: number, value: string) {
        setAnswers((prev) => new Map(prev).set(fieldId, value));
    }

    function handleOptionToggle(fieldId: number, optionId: number) {
        setSelectedOptions((prev) => {
            const next = new Map(prev);
            const set = new Set(next.get(fieldId) ?? []);
            set.has(optionId) ? set.delete(optionId) : set.add(optionId);
            next.set(fieldId, set);
            return next;
        });
    }

    function buildPayload() {
        const dtoAnswers = Array.from(answers.entries()).map(
            ([fieldId, value]) => ({
                fieldId,
                value,
            }),
        );
        const dtoOptions = Array.from(selectedOptions.entries()).flatMap(
            ([fieldId, optionIds]) =>
                Array.from(optionIds).map((optionId) => ({
                    fieldId,
                    optionId,
                })),
        );
        return { answers: dtoAnswers, answerOptions: dtoOptions };
    }

    function handleSave() {
        updateAssessment.mutate(
            { id: assessmentId!, dto: buildPayload() },
            { onSuccess: () => toast.success('Avaliação salva com sucesso') },
        );
    }

    function handleSign() {
        signAssessment.mutate(assessmentId!, {
            onSuccess: () => {
                toast.success('Avaliação assinada com sucesso');
                navigate(`/clinica/pacientes/${patientId}`);
            },
        });
    }

    const isDraft = assessment?.status === 'draft';

    return (
        <ClinicLayout>
            <div className="flex h-[calc(100vh-64px)] flex-col">
                {/* Header */}
                <div className="space-y-3 border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            {assessment?.status === 'signed' && (
                                <Badge
                                    variant="secondary"
                                    className="text-xs"
                                >
                                    Assinada
                                </Badge>
                            )}
                            {isDraft && (
                                <Badge variant="outline" className="text-xs">
                                    Rascunho
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <BackButton
                                to={`/clinica/pacientes/${patientId}`}
                                className="shrink-0"
                            />
                            {isDraft && (
                                <div className="hidden shrink-0 gap-2 sm:flex">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer gap-2"
                                        onClick={handleSave}
                                        disabled={updateAssessment.isPending}
                                    >
                                        <Save className="h-4 w-4" />
                                        {updateAssessment.isPending
                                            ? 'Salvando...'
                                            : 'Salvar rascunho'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="cursor-pointer gap-2"
                                        onClick={handleSign}
                                        disabled={signAssessment.isPending}
                                    >
                                        <PenLine className="h-4 w-4" />
                                        {signAssessment.isPending
                                            ? 'Assinando...'
                                            : 'Assinar'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    {isLoading ? (
                        <Skeleton className="h-5 w-48 sm:h-6 sm:w-64" />
                    ) : (
                        <h2 className="text-base leading-snug font-semibold text-foreground sm:text-lg">
                            {assessment?.template.name}
                        </h2>
                    )}
                </div>

                {/* Body */}
                <ScrollArea className="flex-1">
                    <div className="mx-auto max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6">
                        {isLoading && (
                            <div className="space-y-4">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton
                                        key={i}
                                        className="h-48 w-full rounded-xl"
                                    />
                                ))}
                            </div>
                        )}
                        {isError && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                Erro ao carregar a avaliação
                            </div>
                        )}
                        {assessment &&
                            assessment.template.sections.map((section) => (
                                <SectionCard
                                    key={section.id}
                                    section={section}
                                    answers={answers}
                                    selectedOptions={selectedOptions}
                                    onAnswerChange={handleAnswerChange}
                                    onOptionToggle={handleOptionToggle}
                                    readonly={!isDraft}
                                />
                            ))}
                    </div>
                </ScrollArea>

                {/* Footer (only for draft) */}
                {isDraft && (
                    <div className="flex flex-col gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
                        <Button
                            variant="outline"
                            className="w-full cursor-pointer gap-2 sm:w-auto"
                            onClick={handleSave}
                            disabled={updateAssessment.isPending}
                        >
                            <Save className="h-4 w-4" />
                            {updateAssessment.isPending
                                ? 'Salvando...'
                                : 'Salvar rascunho'}
                        </Button>
                        <Button
                            className="w-full cursor-pointer gap-2 sm:w-auto"
                            onClick={handleSign}
                            disabled={signAssessment.isPending}
                        >
                            <PenLine className="h-4 w-4" />
                            {signAssessment.isPending
                                ? 'Assinando...'
                                : 'Assinar avaliação'}
                        </Button>
                    </div>
                )}
            </div>
        </ClinicLayout>
    );
}
