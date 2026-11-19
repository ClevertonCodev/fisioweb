import { z } from 'zod';

import type { PublicQuestionnaireAnswerWriteDto } from '@/application/patient/ports';
import type {
    PublicQuestion,
    PublicQuestionAnswer,
    PublicQuestionnaire,
} from '@/domain/patient/questionnaire';

export const REQUIRED_ANSWER_MESSAGE = 'Responda esta pergunta.';

export type PublicQuestionnaireFormValues = Record<
    string,
    PublicQuestionAnswer | undefined
>;

export function questionFieldName(questionId: number): string {
    return `q${questionId}`;
}

export function allQuestions(
    questionnaire: PublicQuestionnaire,
): PublicQuestion[] {
    return questionnaire.sections.flatMap((section) => section.questions);
}

export function isQuestionAnswered(
    value: PublicQuestionAnswer | undefined,
): value is PublicQuestionAnswer {
    if (value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    return true;
}

export function isQuestionAnswerable(question: PublicQuestion): boolean {
    if (question.type === 'multiple_choice' || question.type === 'checkbox') {
        return question.options.length > 0;
    }
    return true;
}

export function buildPublicQuestionnaireSchema(questions: PublicQuestion[]) {
    return z
        .record(
            z.string(),
            z.union([z.string(), z.array(z.string()), z.number()]).optional(),
        )
        .superRefine((values, ctx) => {
            for (const question of questions) {
                const field = questionFieldName(question.id);
                if (
                    question.required &&
                    isQuestionAnswerable(question) &&
                    !isQuestionAnswered(values[field])
                ) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: [field],
                        message: REQUIRED_ANSWER_MESSAGE,
                    });
                }
            }
        });
}

export function countAnsweredQuestions(
    questions: PublicQuestion[],
    values: PublicQuestionnaireFormValues,
): number {
    return questions.filter((question) =>
        isQuestionAnswered(values[questionFieldName(question.id)]),
    ).length;
}

export function toAnswerWriteDtos(
    questions: PublicQuestion[],
    values: PublicQuestionnaireFormValues,
): PublicQuestionnaireAnswerWriteDto[] {
    return questions.flatMap((question) => {
        const value = values[questionFieldName(question.id)];
        if (!isQuestionAnswered(value)) return [];
        return [
            {
                questionId: question.id,
                answer: typeof value === 'string' ? value.trim() : value,
            },
        ];
    });
}

export function formatQuestionnaireDeadline(
    expiresAt: string | null,
): string | null {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}
