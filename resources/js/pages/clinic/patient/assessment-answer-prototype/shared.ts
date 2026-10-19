/**
 * PROTÓTIPO (descartável): responder (ou ver) uma avaliação, comum às
 * variantes. A avaliação, o modelo e as respostas são reais; salvar
 * rascunho e assinar são stub.
 *
 * Todas as avaliações do banco de exemplo estão assinadas (só leitura).
 * Para ver o preenchimento, "Ver como rascunho" (?rascunho=1) libera os
 * campos com as respostas que já existem.
 */
import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAssessment } from '@/application/clinic/use-assessments';
import { usePatientDetail } from '@/application/clinic/use-patients';
import type { AssessmentField, AssessmentSection } from '@/domain/clinic';

export const ANSWER_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'C', name: 'Ficha e laudo' },
] as const;

export function sortedSections(sections: AssessmentSection[] = []) {
    return [...sections]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({
            ...s,
            fields: [...s.fields].sort((a, b) => a.sortOrder - b.sortOrder),
        }));
}

export function useAssessmentAnswers() {
    const { id: patientId = '', assessmentId = '' } = useParams();
    const [params, setParams] = useSearchParams();
    const assessment = useAssessment(assessmentId);
    const patient = usePatientDetail(patientId);
    const a = assessment.data;

    const [text, setText] = useState<Record<number, string> | null>(null);
    const [opts, setOpts] = useState<Record<number, number[]> | null>(null);

    // Respostas que vieram da API (até a primeira mudança).
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
    const asDraft = params.get('rascunho') === '1';
    const readOnly = signed && !asDraft;
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

    return {
        loading: assessment.isLoading,
        error: assessment.isError,
        assessment: a,
        patient: patient.data,
        patientId,
        sections,
        values,
        options,
        readOnly,
        signed,
        asDraft,
        progress,
        answered,
        total,
        missing,
        isAnswered,
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
        setDraftMode: (on: boolean) =>
            setParams(
                (prev) => {
                    const next = new URLSearchParams(prev);
                    if (on) next.set('rascunho', '1');
                    else next.delete('rascunho');
                    return next;
                },
                { replace: true },
            ),
        saveDraft: () =>
            toast.success('Protótipo: rascunho não foi salvo.', {
                description: `${answered} de ${total} perguntas respondidas.`,
            }),
        sign: () => {
            if (missing.length > 0) {
                toast.error(
                    `Faltam ${missing.length} ${missing.length === 1 ? 'pergunta obrigatória' : 'perguntas obrigatórias'}.`,
                );
                return false;
            }
            toast.success('Protótipo: avaliação não foi assinada.');
            return true;
        },
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
