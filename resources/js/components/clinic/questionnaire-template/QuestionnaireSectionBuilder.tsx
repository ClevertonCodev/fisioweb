import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import {
    createDraftQuestion,
    createDraftSection,
    questionTypeLabels,
    type DraftQuestion,
    type DraftSection,
    type QuestionType,
} from './types';

interface Props {
    sections: DraftSection[];
    onChange: (sections: DraftSection[]) => void;
}

function moveUp<T>(arr: T[], i: number): T[] {
    if (i <= 0) return arr;
    const next = [...arr];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    return next;
}

function moveDown<T>(arr: T[], i: number): T[] {
    if (i >= arr.length - 1) return arr;
    const next = [...arr];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    return next;
}

function updateQuestion(
    sections: DraftSection[],
    si: number,
    qi: number,
    updater: (q: DraftQuestion) => DraftQuestion,
): DraftSection[] {
    return sections.map((s, sIdx) =>
        sIdx !== si
            ? s
            : { ...s, questions: s.questions.map((q, qIdx) => (qIdx !== qi ? q : updater(q))) },
    );
}

export function QuestionnaireSectionBuilder({ sections, onChange }: Props) {
    return (
        <div className="space-y-4">
            {sections.map((section, si) => (
                <Card key={section._key}>
                    <CardHeader className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <CardTitle className="text-base">Seção {si + 1}</CardTitle>
                            <div className="flex items-center gap-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onChange(moveUp(sections, si))}
                                    disabled={si === 0}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onChange(moveDown(sections, si))}
                                    disabled={si === sections.length - 1}
                                >
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onChange(sections.filter((_, idx) => idx !== si))}
                                >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    Remover seção
                                </Button>
                            </div>
                        </div>
                        <Input
                            placeholder="Título da seção"
                            value={section.title}
                            onChange={(e) =>
                                onChange(
                                    sections.map((s, idx) =>
                                        idx !== si ? s : { ...s, title: e.target.value },
                                    ),
                                )
                            }
                        />
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {section.questions.map((question, qi) => (
                            <div
                                key={question._key}
                                className="bg-muted/30 space-y-3 rounded-md border p-4"
                            >
                                {/* cabeçalho da pergunta */}
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground text-xs font-medium">
                                        Pergunta {qi + 1}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() =>
                                                onChange(
                                                    sections.map((s, sIdx) =>
                                                        sIdx !== si
                                                            ? s
                                                            : {
                                                                  ...s,
                                                                  questions: moveUp(s.questions, qi),
                                                              },
                                                    ),
                                                )
                                            }
                                            disabled={qi === 0}
                                        >
                                            <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() =>
                                                onChange(
                                                    sections.map((s, sIdx) =>
                                                        sIdx !== si
                                                            ? s
                                                            : {
                                                                  ...s,
                                                                  questions: moveDown(s.questions, qi),
                                                              },
                                                    ),
                                                )
                                            }
                                            disabled={qi === section.questions.length - 1}
                                        >
                                            <ArrowDown className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() =>
                                                onChange(
                                                    sections.map((s, sIdx) =>
                                                        sIdx !== si
                                                            ? s
                                                            : {
                                                                  ...s,
                                                                  questions: s.questions.filter(
                                                                      (_, qIdx) => qIdx !== qi,
                                                                  ),
                                                              },
                                                    ),
                                                )
                                            }
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                {/* enunciado */}
                                <div className="space-y-1">
                                    <Label className="text-xs">Enunciado</Label>
                                    <Input
                                        placeholder="Ex.: Apresentação do paciente"
                                        value={question.label}
                                        onChange={(e) =>
                                            onChange(
                                                updateQuestion(sections, si, qi, (q) => ({
                                                    ...q,
                                                    label: e.target.value,
                                                })),
                                            )
                                        }
                                    />
                                </div>

                                {/* tipo */}
                                <div className="space-y-1">
                                    <Label className="text-xs">Tipo de resposta</Label>
                                    <Select
                                        value={question.type}
                                        onValueChange={(v) =>
                                            onChange(
                                                updateQuestion(sections, si, qi, (q) => ({
                                                    ...q,
                                                    type: v as QuestionType,
                                                    options:
                                                        v === 'multiple_choice' || v === 'checkbox'
                                                            ? q.options.length >= 2
                                                                ? q.options
                                                                : ['', '']
                                                            : q.options,
                                                })),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(
                                                Object.entries(questionTypeLabels) as [
                                                    QuestionType,
                                                    string,
                                                ][]
                                            ).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* opções — multiple_choice / checkbox */}
                                {(question.type === 'multiple_choice' ||
                                    question.type === 'checkbox') && (
                                    <div className="space-y-2">
                                        <Label className="text-xs">Opções</Label>
                                        {question.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-2">
                                                <span className="text-muted-foreground w-5 text-xs">
                                                    {String.fromCharCode(65 + oi)}.
                                                </span>
                                                <Input
                                                    placeholder={`Opção ${oi + 1}`}
                                                    value={opt}
                                                    onChange={(e) =>
                                                        onChange(
                                                            updateQuestion(
                                                                sections,
                                                                si,
                                                                qi,
                                                                (q) => ({
                                                                    ...q,
                                                                    options: q.options.map(
                                                                        (o, oIdx) =>
                                                                            oIdx === oi
                                                                                ? e.target.value
                                                                                : o,
                                                                    ),
                                                                }),
                                                            ),
                                                        )
                                                    }
                                                />
                                                {question.options.length > 2 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            onChange(
                                                                updateQuestion(
                                                                    sections,
                                                                    si,
                                                                    qi,
                                                                    (q) => ({
                                                                        ...q,
                                                                        options: q.options.filter(
                                                                            (_, oIdx) => oIdx !== oi,
                                                                        ),
                                                                    }),
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                onChange(
                                                    updateQuestion(sections, si, qi, (q) => ({
                                                        ...q,
                                                        options: [...q.options, ''],
                                                    })),
                                                )
                                            }
                                        >
                                            <Plus className="mr-1 h-3.5 w-3.5" />
                                            Adicionar opção
                                        </Button>
                                    </div>
                                )}

                                {/* escala */}
                                {question.type === 'scale' && (
                                    <div className="flex gap-4">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Mínimo</Label>
                                            <Input
                                                type="number"
                                                className="w-20"
                                                value={question.scaleMin}
                                                onChange={(e) =>
                                                    onChange(
                                                        updateQuestion(sections, si, qi, (q) => ({
                                                            ...q,
                                                            scaleMin: Number(e.target.value),
                                                        })),
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Máximo</Label>
                                            <Input
                                                type="number"
                                                className="w-20"
                                                value={question.scaleMax}
                                                onChange={(e) =>
                                                    onChange(
                                                        updateQuestion(sections, si, qi, (q) => ({
                                                            ...q,
                                                            scaleMax: Number(e.target.value),
                                                        })),
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* obrigatória */}
                                <div className="flex items-center gap-2">
                                    <Switch
                                        id={`required-${question._key}`}
                                        checked={question.required}
                                        onCheckedChange={(v) =>
                                            onChange(
                                                updateQuestion(sections, si, qi, (q) => ({
                                                    ...q,
                                                    required: v,
                                                })),
                                            )
                                        }
                                    />
                                    <Label
                                        htmlFor={`required-${question._key}`}
                                        className="text-xs font-normal"
                                    >
                                        Obrigatória
                                    </Label>
                                </div>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onChange(
                                    sections.map((s, sIdx) =>
                                        sIdx !== si
                                            ? s
                                            : { ...s, questions: [...s.questions, createDraftQuestion()] },
                                    ),
                                )
                            }
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Adicionar pergunta
                        </Button>
                    </CardContent>
                </Card>
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={() => onChange([...sections, createDraftSection()])}
            >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar seção
            </Button>
        </div>
    );
}
