import { CheckCircle2, Link2Off } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useUnsubscribeReminders } from '@/application/patient/use-reminder-unsubscribe';
import { DsButton } from '@/components/ds';
import { DsPatientNavbar } from '@/components/ds/navbar/DsPatientNavbar';

function Message({
    icon,
    title,
    children,
}: {
    icon?: ReactNode;
    title: ReactNode;
    children?: ReactNode;
}) {
    return (
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-14 text-center">
            {icon && <span aria-hidden>{icon}</span>}
            <h1 className="text-ds-h3 font-semibold text-ds-content-primary">
                {title}
            </h1>
            {children}
        </div>
    );
}

export default function ReminderUnsubscribePage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const unsubscribe = useUnsubscribeReminders();

    const content = () => {
        if (!token || unsubscribe.data === 'invalid') {
            return (
                <Message
                    icon={
                        <Link2Off className="size-14 text-ds-content-muted" />
                    }
                    title="Link inválido"
                >
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Confira se o link está completo ou fale com a clínica.
                    </p>
                </Message>
            );
        }
        if (unsubscribe.data === 'unsubscribed') {
            return (
                <Message
                    icon={
                        <CheckCircle2 className="size-14 text-ds-status-success-content" />
                    }
                    title="Pronto."
                >
                    <p className="text-ds-body-sm text-ds-content-secondary">
                        Você não vai mais receber lembretes. Para voltar a
                        receber, fale com a clínica.
                    </p>
                </Message>
            );
        }

        return (
            <Message
                title={
                    <>
                        Não quer mais receber lembretes de consulta por{' '}
                        <span className="whitespace-nowrap">e-mail</span>?
                    </>
                }
            >
                <DsButton
                    label="Não quero mais receber lembretes"
                    loading={unsubscribe.isPending}
                    disabled={unsubscribe.isPending}
                    onClick={() => unsubscribe.mutate(token)}
                />
                {unsubscribe.data === 'rate_limited' && (
                    <p
                        role="alert"
                        className="text-ds-body-sm text-ds-status-danger-content"
                    >
                        Muitas tentativas. Aguarde um minuto e tente de novo.
                    </p>
                )}
                {unsubscribe.isError && (
                    <p
                        role="alert"
                        className="text-ds-body-sm text-ds-status-danger-content"
                    >
                        Não foi possível concluir. Confira sua conexão e tente
                        de novo.
                    </p>
                )}
            </Message>
        );
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar hideAuthAction disableBrandLink />
            <main className="flex flex-1 flex-col">{content()}</main>
        </div>
    );
}
