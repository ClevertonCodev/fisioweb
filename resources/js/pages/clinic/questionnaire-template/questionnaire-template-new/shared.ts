import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { QuestionnaireTemplateWriteDto } from '@/application/clinic/ports';
import { useCreateQuestionnaireTemplate } from '@/application/clinic/use-questionnaire-templates';
import {
    createDraftQuestion,
    createDraftSection,
    type DraftQuestion,
    type DraftSection,
    type QuestionType,
} from '@/components/clinic/questionnaire-template/types';

export const TYPE_LABEL: Record<QuestionType, string> = {
    multiple_choice: 'Escolha única',
    checkbox: 'Várias opções',
    scale: 'Escala',
    text: 'Texto',
};

export interface BankItem {
    key: string;
    group: string;
    label: string;
    type: QuestionType;
    options?: string[];
    scaleMin?: number;
    scaleMax?: number;
}

export const BANK: BankItem[] = [
    {
        key: 'dor',
        group: 'Dor',
        label: 'De 0 a 10, quanto dói agora?',
        type: 'scale',
        scaleMin: 0,
        scaleMax: 10,
    },
    {
        key: 'onde',
        group: 'Dor',
        label: 'Onde dói?',
        type: 'checkbox',
        options: [
            'Pescoço',
            'Ombro',
            'Costas (parte alta)',
            'Lombar',
            'Quadril',
            'Joelho',
            'Tornozelo ou pé',
            'Outro lugar',
        ],
    },
    {
        key: 'tempo',
        group: 'Dor',
        label: 'Há quanto tempo sente isso?',
        type: 'multiple_choice',
        options: [
            'Menos de 1 semana',
            '1 a 4 semanas',
            '1 a 3 meses',
            'Mais de 3 meses',
        ],
    },
    { key: 'piora', group: 'Dor', label: 'O que piora a dor?', type: 'text' },
    {
        key: 'sono',
        group: 'Rotina',
        label: 'A dor atrapalha o sono?',
        type: 'multiple_choice',
        options: ['Não', 'Às vezes', 'Quase toda noite'],
    },
    {
        key: 'atividade',
        group: 'Rotina',
        label: 'Pratica atividade física?',
        type: 'multiple_choice',
        options: [
            'Não',
            '1 a 2 vezes por semana',
            '3 ou mais vezes por semana',
        ],
    },
    {
        key: 'trabalho',
        group: 'Rotina',
        label: 'Como é o seu trabalho?',
        type: 'multiple_choice',
        options: [
            'Sentado a maior parte do tempo',
            'Em pé a maior parte do tempo',
            'Com esforço físico',
            'Não trabalho no momento',
        ],
    },
    {
        key: 'objetivo',
        group: 'Tratamento',
        label: 'O que você espera do tratamento?',
        type: 'text',
    },
    {
        key: 'exercicios',
        group: 'Tratamento',
        label: 'Fez os exercícios de casa nesta semana?',
        type: 'multiple_choice',
        options: ['Todos os dias', 'Alguns dias', 'Não consegui'],
    },
    {
        key: 'melhora',
        group: 'Tratamento',
        label: 'De 0 a 10, quanto melhorou desde o início?',
        type: 'scale',
        scaleMin: 0,
        scaleMax: 10,
    },
];

export function fromBank(item: BankItem): DraftQuestion {
    return {
        ...createDraftQuestion(),
        label: item.label,
        type: item.type,
        options: item.options ? [...item.options] : ['', ''],
        scaleMin: item.scaleMin ?? 0,
        scaleMax: item.scaleMax ?? 10,
    };
}

export function validate(
    title: string,
    sections: DraftSection[],
): string | null {
    if (!title.trim()) return 'Dê um título ao questionário.';
    if (sections.length === 0) return 'Adicione ao menos uma seção.';
    for (const s of sections) {
        if (!s.title.trim()) return 'Todas as seções precisam de título.';
        if (s.questions.length === 0) {
            return `A seção "${s.title}" está sem perguntas.`;
        }
        for (const q of s.questions) {
            if (!q.label.trim()) return 'Há uma pergunta sem enunciado.';
            if (
                (q.type === 'multiple_choice' || q.type === 'checkbox') &&
                q.options.some((o) => !o.trim())
            ) {
                return `"${q.label}" tem opção vazia.`;
            }
        }
    }
    return null;
}

export function toWriteDto(
    title: string,
    description: string,
    sections: DraftSection[],
): QuestionnaireTemplateWriteDto {
    return {
        title: title.trim(),
        description: description.trim() || null,
        sections: sections.map((s) => ({
            title: s.title.trim(),
            questions: s.questions.map((q) => ({
                label: q.label.trim(),
                type: q.type,
                options:
                    q.type === 'multiple_choice' || q.type === 'checkbox'
                        ? q.options.map((o) => o.trim())
                        : null,
                scaleMin: q.scaleMin,
                scaleMax: q.scaleMax,
                required: q.required,
            })),
        })),
    };
}

export function numbering(sections: DraftSection[]): Map<string, number> {
    return new Map(
        sections
            .flatMap((s) => s.questions)
            .map((q, i) => [q._key, i + 1] as const),
    );
}

export function useQuestionnaireBuilder(initial?: DraftSection[]) {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const returnTo = params.get('returnTo');
    const createTemplate = useCreateQuestionnaireTemplate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sections, setSections] = useState<DraftSection[]>(
        () => initial ?? [{ ...createDraftSection(), title: 'Perguntas' }],
    );
    const [error, setError] = useState<string | null>(null);

    const updateSection = (key: string, patch: Partial<DraftSection>) =>
        setSections((prev) =>
            prev.map((s) => (s._key === key ? { ...s, ...patch } : s)),
        );

    const updateQuestion = (
        sectionKey: string,
        qKey: string,
        patch: Partial<DraftQuestion>,
    ) =>
        setSections((prev) =>
            prev.map((s) =>
                s._key !== sectionKey
                    ? s
                    : {
                          ...s,
                          questions: s.questions.map((q) =>
                              q._key === qKey ? { ...q, ...patch } : q,
                          ),
                      },
            ),
        );

    const addQuestion = (sectionKey: string, q = createDraftQuestion()) => {
        setSections((prev) =>
            prev.map((s) =>
                s._key === sectionKey
                    ? { ...s, questions: [...s.questions, q] }
                    : s,
            ),
        );
        return q._key;
    };

    const removeQuestion = (sectionKey: string, qKey: string) =>
        setSections((prev) =>
            prev.map((s) =>
                s._key === sectionKey
                    ? {
                          ...s,
                          questions: s.questions.filter((q) => q._key !== qKey),
                      }
                    : s,
            ),
        );

    const moveQuestion = (sectionKey: string, qKey: string, dir: -1 | 1) =>
        setSections((prev) =>
            prev.map((s) => {
                if (s._key !== sectionKey) return s;
                const i = s.questions.findIndex((q) => q._key === qKey);
                const j = i + dir;
                if (i < 0 || j < 0 || j >= s.questions.length) return s;
                const qs = [...s.questions];
                [qs[i], qs[j]] = [qs[j]!, qs[i]!];
                return { ...s, questions: qs };
            }),
        );

    const duplicateQuestion = (sectionKey: string, qKey: string) =>
        setSections((prev) =>
            prev.map((s) => {
                if (s._key !== sectionKey) return s;
                const i = s.questions.findIndex((q) => q._key === qKey);
                const q = s.questions[i];
                if (!q) return s;
                const copy = {
                    ...q,
                    _key: crypto.randomUUID(),
                    options: [...q.options],
                };
                const qs = [...s.questions];
                qs.splice(i + 1, 0, copy);
                return { ...s, questions: qs };
            }),
        );

    const addSection = () => {
        const s = { ...createDraftSection(), title: '' };
        setSections((prev) => [...prev, s]);
        return s;
    };

    const removeSection = (key: string) =>
        setSections((prev) => prev.filter((s) => s._key !== key));

    const count = sections.reduce((n, s) => n + s.questions.length, 0);

    const save = async () => {
        const err = validate(title, sections);
        setError(err);
        if (err) return;
        try {
            await createTemplate.mutateAsync(
                toWriteDto(title, description, sections),
            );
            navigate(returnTo ?? '/clinica/pacientes');
        } catch {
            // toast no hook
        }
    };

    return {
        title,
        setTitle,
        description,
        setDescription,
        sections,
        setSections,
        updateSection,
        updateQuestion,
        addQuestion,
        removeQuestion,
        moveQuestion,
        duplicateQuestion,
        addSection,
        removeSection,
        count,
        error,
        saving: createTemplate.isPending,
        save,
        back: () => (returnTo ? navigate(returnTo) : navigate(-1)),
        returnTo,
    };
}

export type QuestionnaireBuilder = ReturnType<typeof useQuestionnaireBuilder>;
