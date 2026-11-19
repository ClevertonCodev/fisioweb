import { Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
    allQuestions,
    type PublicQuestionnaireFormValues,
    toAnswerWriteDtos,
} from '@/application/patient/public-questionnaire-form';
import {
    usePublicQuestionnaire,
    useSubmitPublicQuestionnaire,
} from '@/application/patient/use-public-questionnaire';
import { DsPatientNavbar } from '@/components/ds/navbar/DsPatientNavbar';

import { PublicQuestionnaireForm } from './components/PublicQuestionnaireForm';
import {
    PublicQuestionnaireMessage,
    type PublicQuestionnaireMessageKind,
} from './components/PublicQuestionnaireMessage';

export default function PublicQuestionnaireAnswerPage() {
    const { token = '' } = useParams<{ token: string }>();
    const lookup = usePublicQuestionnaire(token);
    const submit = useSubmitPublicQuestionnaire(token);
    const [finished, setFinished] =
        useState<PublicQuestionnaireMessageKind | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const submitting = useRef(false);

    const questionnaire =
        lookup.data?.state === 'pending' ? lookup.data.questionnaire : null;

    const handleSubmit = async (values: PublicQuestionnaireFormValues) => {
        if (!questionnaire || submitting.current) return;
        submitting.current = true;
        setSubmitError(null);
        try {
            const result = await submit.mutateAsync(
                toAnswerWriteDtos(allQuestions(questionnaire), values),
            );
            if (result.state === 'rejected') {
                setSubmitError(result.message);
                return;
            }
            setFinished(result.state);
        } catch {
            setSubmitError(
                'Não foi possível enviar suas respostas. Confira sua conexão e tente de novo.',
            );
        } finally {
            submitting.current = false;
        }
    };

    const content = () => {
        if (finished) return <PublicQuestionnaireMessage kind={finished} />;
        if (lookup.isLoading) {
            return (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-ds-content-secondary">
                    <Loader2 className="size-8 animate-spin text-ds-content-brand" />
                    <p className="text-ds-body-xs">Carregando questionário…</p>
                </div>
            );
        }
        if (!lookup.data) {
            return <PublicQuestionnaireMessage kind="error" />;
        }
        if (lookup.data.state !== 'pending') {
            return <PublicQuestionnaireMessage kind={lookup.data.state} />;
        }
        return (
            <PublicQuestionnaireForm
                questionnaire={lookup.data.questionnaire}
                sending={submit.isPending}
                submitError={submitError}
                onSubmit={(values) => void handleSubmit(values)}
            />
        );
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar
                clinicName={questionnaire?.clinicName ?? undefined}
                hideAuthAction
                disableBrandLink
            />
            <main className="flex flex-1 flex-col">{content()}</main>
        </div>
    );
}
