import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Controller,
    type FieldErrors,
    useForm,
    useWatch,
} from 'react-hook-form';

import {
    allQuestions,
    buildPublicQuestionnaireSchema,
    countAnsweredQuestions,
    formatQuestionnaireDeadline,
    isQuestionAnswerable,
    type PublicQuestionnaireFormValues,
    questionFieldName,
} from '@/application/patient/public-questionnaire-form';
import { DsAlert } from '@/components/ds/alert/DsAlert';
import { DsButton } from '@/components/ds/button/DsButton';
import { dsCn } from '@/components/ds/utils/ds-cn';
import type { PublicQuestionnaire } from '@/domain/patient/questionnaire';

import { QuestionField } from './QuestionField';

interface PublicQuestionnaireFormProps {
    questionnaire: PublicQuestionnaire;
    sending: boolean;
    submitError: string | null;
    onSubmit: (values: PublicQuestionnaireFormValues) => void;
}

function questionElementId(questionId: number): string {
    return `pergunta-${questionId}`;
}

export function PublicQuestionnaireForm({
    questionnaire,
    sending,
    submitError,
    onSubmit,
}: PublicQuestionnaireFormProps) {
    const questions = useMemo(
        () => allQuestions(questionnaire),
        [questionnaire],
    );
    const schema = useMemo(
        () => buildPublicQuestionnaireSchema(questions),
        [questions],
    );

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitted },
    } = useForm<PublicQuestionnaireFormValues>({
        resolver: zodResolver(schema),
        defaultValues: {},
    });
    const values = useWatch({ control }) as PublicQuestionnaireFormValues;

    const answered = countAnsweredQuestions(questions, values);
    const missing = Object.keys(errors).length;
    const clinic = questionnaire.clinicName ?? 'A clínica';
    const [blankAttempts, setBlankAttempts] = useState(0);
    const blankAlert = useRef<HTMLDivElement>(null);
    const answerableCount = questions.filter(isQuestionAnswerable).length;
    const nothingToAnswer = answerableCount === 0;
    const showBlankAlert = blankAttempts > 0 && answered === 0;

    useEffect(() => {
        if (blankAttempts === 0) return;
        blankAlert.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });
    }, [blankAttempts]);
    const deadline = formatQuestionnaireDeadline(questionnaire.expiresAt);

    const scrollToFirstMissing = (
        fieldErrors: FieldErrors<PublicQuestionnaireFormValues>,
    ) => {
        const first = questions.find(
            (question) => fieldErrors[questionFieldName(question.id)],
        );
        if (!first) return;
        document
            .getElementById(questionElementId(first.id))
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <form
            noValidate
            onSubmit={handleSubmit((formValues) => {
                if (countAnsweredQuestions(questions, formValues) === 0) {
                    setBlankAttempts((attempts) => attempts + 1);
                    return;
                }
                onSubmit(formValues);
            }, scrollToFirstMissing)}
            className="flex flex-1 flex-col"
        >
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
                <header className="flex flex-col gap-2 border-b border-ds-border-subtle pb-5">
                    {questionnaire.clinicName && (
                        <p className="text-ds-caption font-semibold tracking-wide text-ds-content-brand uppercase">
                            {questionnaire.clinicName}
                        </p>
                    )}
                    <h1 className="text-ds-h3 font-semibold text-ds-content-primary">
                        {questionnaire.title}
                    </h1>
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        {clinic} pediu que você responda este questionário. Suas
                        respostas vão só para a clínica.
                    </p>
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        {deadline && <>Prazo: responder até {deadline}. </>}
                        As perguntas com{' '}
                        <span className="text-ds-content-danger">*</span> são
                        obrigatórias.
                    </p>
                </header>

                {questionnaire.sections.map((section, index) => (
                    <section
                        key={section.id}
                        aria-labelledby={`secao-${section.id}`}
                        className="flex flex-col gap-6"
                    >
                        <h2
                            id={`secao-${section.id}`}
                            className="flex items-center gap-2 text-ds-body-lg font-semibold text-ds-content-primary"
                        >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-ds-full bg-ds-surface-brand-subtle text-ds-caption text-ds-content-brand">
                                {index + 1}
                            </span>
                            {section.title}
                        </h2>

                        {section.questions.map((question) => {
                            const field = questionFieldName(question.id);
                            const error = errors[field]?.message;
                            const labelId = `pergunta-${question.id}-titulo`;
                            return (
                                <div
                                    key={question.id}
                                    id={questionElementId(question.id)}
                                    className={dsCn(
                                        'flex flex-col gap-3 rounded-ds-lg',
                                        error &&
                                            'outline-2 outline-offset-8 outline-ds-danger-80 outline-solid',
                                    )}
                                >
                                    <p
                                        id={labelId}
                                        className="relative text-ds-body-md font-medium text-ds-content-primary"
                                    >
                                        {question.label}
                                        {question.required &&
                                            isQuestionAnswerable(question) && (
                                                <>
                                                    <span
                                                        aria-hidden
                                                        className="ml-1 text-ds-content-danger"
                                                    >
                                                        *
                                                    </span>
                                                    <span className="sr-only">
                                                        (obrigatória)
                                                    </span>
                                                </>
                                            )}
                                    </p>
                                    <Controller
                                        control={control}
                                        name={field}
                                        render={({ field: input }) => (
                                            <QuestionField
                                                question={question}
                                                labelId={labelId}
                                                value={input.value}
                                                invalid={!!error}
                                                onChange={input.onChange}
                                            />
                                        )}
                                    />
                                    {error && (
                                        <p
                                            role="alert"
                                            className="text-ds-caption text-ds-content-danger"
                                        >
                                            {error}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </section>
                ))}

                {nothingToAnswer && (
                    <DsAlert variant="info" mode="compact">
                        Este questionário não tem perguntas para responder. Fale
                        com a clínica.
                    </DsAlert>
                )}

                {showBlankAlert && (
                    <div ref={blankAlert}>
                        <DsAlert variant="warning" mode="compact">
                            Responda pelo menos uma pergunta.
                        </DsAlert>
                    </div>
                )}

                {submitError && (
                    <DsAlert variant="danger" mode="compact">
                        {submitError}
                    </DsAlert>
                )}
            </div>

            <div className="sticky bottom-0 z-20 mt-auto border-t border-ds-border-default bg-ds-surface-default/95 backdrop-blur-md">
                <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3 sm:px-6">
                    <p className="flex-1 text-ds-caption text-ds-content-secondary">
                        {answered} de {answerableCount} respondidas
                        {isSubmitted && missing > 0 && (
                            <span className="text-ds-content-danger">
                                {' '}
                                ·{' '}
                                {missing === 1
                                    ? 'falta 1 obrigatória'
                                    : `faltam ${missing} obrigatórias`}
                            </span>
                        )}
                    </p>
                    <DsButton
                        type="submit"
                        size="lg"
                        iconPosition="left"
                        icon={<Send className="size-4" />}
                        label={sending ? 'Enviando…' : 'Enviar'}
                        disabled={sending || nothingToAnswer}
                    />
                </div>
            </div>
        </form>
    );
}
