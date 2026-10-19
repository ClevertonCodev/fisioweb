import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
    authErrorMessage,
    requestClinicPasswordReset,
} from '@/application/clinic';
import { AuthLayout, TextLink } from '@/components/clinic/auth/AuthLayout';
import { DsAlert, DsButton, DsInput } from '@/components/ds';

const schema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Informe o e-mail')
        .email('E-mail inválido'),
});

type ForgotForm = z.infer<typeof schema>;

/** A API segura um novo link por 60 s (config/auth.php, throttle). */
const RESEND_SECONDS = 60;

const FALLBACK_ERROR = 'Não foi possível enviar agora. Tente de novo.';

export default function ClinicForgotPasswordPage() {
    const navigate = useNavigate();
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wait, setWait] = useState(0);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotForm>({
        resolver: zodResolver(schema),
        defaultValues: { email: '' },
    });

    useEffect(() => {
        if (wait <= 0) return;
        const timer = setTimeout(() => setWait((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [wait]);

    const send = async (email: string) => {
        setError(null);
        setSending(true);
        try {
            await requestClinicPasswordReset(email);
            setSentTo(email);
            setWait(RESEND_SECONDS);
        } catch (err) {
            setError(authErrorMessage(err, FALLBACK_ERROR));
        } finally {
            setSending(false);
        }
    };
    const submit = handleSubmit(({ email }) => send((email ?? '').trim()));
    const toLogin = () => navigate('/clinica/login');

    if (sentTo) {
        return (
            <AuthLayout
                title="Link enviado"
                subtitle="Siga o link do e-mail para criar uma senha nova."
            >
                <div className="flex flex-col gap-5">
                    <DsAlert
                        variant="success"
                        mode="rich"
                        title="Confira seu e-mail"
                    >
                        Se houver uma conta com <strong>{sentTo}</strong>, o
                        link para criar uma senha nova chega em alguns minutos.
                        Ele vale por 1 hora. Olhe também o spam.
                    </DsAlert>
                    {error && (
                        <DsAlert variant="danger" mode="compact">
                            {error}
                        </DsAlert>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        <DsButton
                            variant="secondary"
                            size="full"
                            label="Abrir o Gmail"
                            onClick={() =>
                                window.open(
                                    'https://mail.google.com',
                                    '_blank',
                                    'noopener,noreferrer',
                                )
                            }
                        />
                        <DsButton
                            variant="secondary"
                            size="full"
                            label="Abrir o Outlook"
                            onClick={() =>
                                window.open(
                                    'https://outlook.live.com',
                                    '_blank',
                                    'noopener,noreferrer',
                                )
                            }
                        />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center">
                        <span className="text-ds-caption text-ds-content-muted">
                            Não chegou?
                        </span>
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            label={
                                wait > 0
                                    ? `Reenviar em ${wait} s`
                                    : 'Reenviar o link'
                            }
                            disabled={wait > 0}
                            loading={sending}
                            onClick={() => send(sentTo)}
                        />
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            label="Usar outro e-mail"
                            onClick={() => {
                                setError(null);
                                setSentTo(null);
                            }}
                        />
                    </div>
                    <DsButton
                        variant="secondary"
                        size="full"
                        label="Voltar para o login"
                        onClick={toLogin}
                    />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Recuperar senha"
            subtitle="Informe o e-mail da conta e mandamos um link para criar uma senha nova."
        >
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {error && (
                    <DsAlert variant="danger" mode="compact">
                        {error}
                    </DsAlert>
                )}
                <DsInput
                    type="email"
                    label="E-mail da conta"
                    placeholder="voce@clinica.com"
                    autocomplete="email"
                    autoFocus
                    state={errors.email ? 'error' : 'default'}
                    helper={errors.email?.message}
                    {...register('email')}
                />
                <DsButton
                    type="submit"
                    size="full"
                    label="Enviar link de redefinição"
                    loading={sending}
                />
            </form>
            <TextLink onClick={toLogin} className="self-center text-ds-caption">
                Lembrei a senha, voltar para o login
            </TextLink>
        </AuthLayout>
    );
}
