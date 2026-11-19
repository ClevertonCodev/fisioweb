import { CheckCircle2, CircleAlert, Clock, Link2Off } from 'lucide-react';
import type { ReactNode } from 'react';

import type { PublicQuestionnaireUnavailable } from '@/domain/patient/questionnaire';

export type PublicQuestionnaireMessageKind =
    | PublicQuestionnaireUnavailable
    | 'sent'
    | 'error';

const MESSAGES: Record<
    PublicQuestionnaireMessageKind,
    { icon: ReactNode; title: string; description: string }
> = {
    sent: {
        icon: (
            <CheckCircle2 className="size-14 text-ds-status-success-content" />
        ),
        title: 'Respostas enviadas',
        description:
            'Obrigado! A clínica já pode ver suas respostas. Você pode fechar esta página.',
    },
    answered: {
        icon: (
            <CheckCircle2 className="size-14 text-ds-status-success-content" />
        ),
        title: 'Você já respondeu este questionário',
        description:
            'As respostas já foram para a clínica. Não precisa fazer mais nada.',
    },
    expired: {
        icon: <Clock className="size-14 text-ds-status-warning-content" />,
        title: 'O prazo para responder acabou',
        description: 'Se ainda quiser responder, peça um novo link à clínica.',
    },
    not_found: {
        icon: <Link2Off className="size-14 text-ds-content-muted" />,
        title: 'Link não encontrado',
        description:
            'Confira se o link está completo ou peça um novo à clínica.',
    },
    error: {
        icon: <CircleAlert className="size-14 text-ds-status-danger-content" />,
        title: 'Não foi possível abrir o questionário',
        description: 'Confira sua conexão e tente de novo em instantes.',
    },
};

export function PublicQuestionnaireMessage({
    kind,
}: {
    kind: PublicQuestionnaireMessageKind;
}) {
    const message = MESSAGES[kind];

    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-14 text-center">
            <span aria-hidden>{message.icon}</span>
            <h1 className="text-ds-h3 font-semibold text-ds-content-primary">
                {message.title}
            </h1>
            <p className="text-ds-body-sm text-ds-content-secondary">
                {message.description}
            </p>
        </div>
    );
}
