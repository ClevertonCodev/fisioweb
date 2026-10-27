import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { AssessmentUpdateDto } from '@/application/clinic/ports';
import {
    useAssessment,
    useSignAssessment,
    useUpdateAssessment,
} from '@/application/clinic/use-assessments';
import { usePatientDetail } from '@/application/clinic/use-patients';
import type { AssessmentField, AssessmentSection } from '@/domain/clinic';

export function sortedSections(sections: AssessmentSection[] = []) {
    return [...sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
            ...s,
            fields: [...s.fields].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
}

export function toUpdateDto(
    values: Record<number, string>,
    options: Record<number, number[]>,
): AssessmentUpdateDto {
    return {
        answers: Object.entries(values).map(([fieldId, value]) => ({
            fieldId: Number(fieldId),
            value,
        })),
        answerOptions: Object.entries(options).flatMap(([fieldId, ids]) =>
            ids.map((optionId) => ({
                fieldId: Number(fieldId),
                optionId,
            })),
        ),
    };
}

export function useAssessmentAnswers() {
    const { id: patientId = '', assessmentId = '' } = useParams();
    const assessment = useAssessment(assessmentId);
    const patient = usePatientDetail(patientId);
    const updateAssessment = useUpdateAssessment();
    const signAssessment = useSignAssessment(patientId);
    const a = assessment.data;
    const belongsToPatient = a != null && String(a.patientId) === patientId;

    const [text, setText] = useState<Record<number, string> | null>(null);
    const [opts, setOpts] = useState<Record<number, number[]> | null>(null);

    const initialText = useMemo(
        () =>
            Object.fromEntries(
                (a?.answers ?? []).map((x) => [x.fieldId, x.value ?? '']),
            ) as Record<number, string>,
        [a],
    );
    const initialOpts = useMemo(() => {
        const map: Record<number, number[]> = {};
        for (const x of a?.answerOptions ?? []) {
            map[x.fieldId] = [...(map[x.fieldId] ?? []), x.optionId];
        }
        return map;
    }, [a]);
    const values = text ?? initialText;
    const options = opts ?? initialOpts;

    const signed = a?.status === 'signed';
    const readOnly = signed;
    const sections = useMemo(() => sortedSections(a?.template.sections), [a]);

    const isAnswered = (f: AssessmentField) =>
        f.fieldType === 'checkbox'
            ? (options[f.id]?.length ?? 0) > 0
            : (values[f.id] ?? '').trim() !== '';

    const progress = sections.map((s) => ({
        id: s.id,
        answered: s.fields.filter(isAnswered).length,
        total: s.fields.length,
        missingRequired: s.fields.filter((f) => f.required && !isAnswered(f)),
    }));
    const answered = progress.reduce((n, p) => n + p.answered, 0);
    const total = progress.reduce((n, p) => n + p.total, 0);
    const missing = progress.flatMap((p) => p.missingRequired);

    function payload(): AssessmentUpdateDto {
        return toUpdateDto(values, options);
    }

    function saveDraft() {
        if (!assessmentId) return;
        updateAssessment.mutate(
            { id: assessmentId, dto: payload() },
            { onSuccess: () => toast.success('Avaliação salva com sucesso') },
        );
    }

    function sign() {
        if (!assessmentId) return;
        if (missing.length > 0) {
            toast.error(
                `Faltam ${missing.length} ${missing.length === 1 ? 'pergunta obrigatória' : 'perguntas obrigatórias'}.`,
            );
            return;
        }
        updateAssessment.mutate(
            { id: assessmentId, dto: payload() },
            {
                onSuccess: () => {
                    signAssessment.mutate(assessmentId, {
                        onSuccess: () =>
                            toast.success('Avaliação assinada com sucesso'),
                    });
                },
            },
        );
    }

    return {
        loading: assessment.isLoading,
        error: assessment.isError || (a != null && !belongsToPatient),
        assessment: a != null && belongsToPatient ? a : undefined,
        patient: patient.data,
        patientId,
        sections,
        values,
        options,
        readOnly,
        signed,
        progress,
        answered,
        total,
        missing,
        isAnswered,
        saving: updateAssessment.isPending,
        signing: signAssessment.isPending,
        setValue: (fieldId: number, v: string) =>
            setText({ ...values, [fieldId]: v }),
        toggleOption: (fieldId: number, optionId: number) => {
            const cur = options[fieldId] ?? [];
            setOpts({
                ...options,
                [fieldId]: cur.includes(optionId)
                    ? cur.filter((x) => x !== optionId)
                    : [...cur, optionId],
            });
        },
        saveDraft,
        sign,
    };
}

export type AnswerState = ReturnType<typeof useAssessmentAnswers>;

/** Texto da resposta para leitura (laudo, assinada). */
export function answerText(s: AnswerState, f: AssessmentField): string {
    if (f.fieldType === 'checkbox') {
        const picked = s.options[f.id] ?? [];
        return f.options
            .filter((o) => picked.includes(o.id))
            .map((o) => o.label)
            .join(', ');
    }
    const v = (s.values[f.id] ?? '').trim();
    if (!v) return '';
    if (f.fieldType === 'number' && f.config?.unit)
        return `${v} ${f.config.unit}`;
    if (f.fieldType === 'range') return `${v} de ${f.config?.max ?? 10}`;
    return v;
}
