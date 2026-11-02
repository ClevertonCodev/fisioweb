import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import {
    authErrorMessage,
    resendClinicVerification,
    verifyClinicEmail,
} from '@/application/clinic';
import { AuthLayout, TextLink } from '@/components/clinic/auth/AuthLayout';
import { DsAlert, DsButton, DsInput } from '@/components/ds';

const resendSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Informe o e-mail')
        .email('E-mail inválido'),
});

type ResendForm = z.infer<typeof resendSchema>;

type VerifyOutcome = 'loading' | 'confirmed' | 'invalid';

const RESEND_COOLDOWN_SECONDS = 30;

export default function ClinicVerifyEmailPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const idParam = params.get('id') ?? '';
    const hash = params.get('hash') ?? '';
    const expiresParam = params.get('expires') ?? '';
    const signature = params.get('signature') ?? '';
    const initialEmail = params.get('email') ?? '';

    const hasValidParams =
        Number(idParam) > 0 &&
        Boolean(hash) &&
        Number(expiresParam) > 0 &&
        Boolean(signature);

    const [outcome, setOutcome] = useState<VerifyOutcome>(
        hasValidParams ? 'loading' : 'invalid',
    );
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [resendError, setResendError] = useState<string | null>(null);
    const [wait, setWait] = useState(0);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResendForm>({
        resolver: zodResolver(resendSchema),
        defaultValues: { email: initialEmail },
    });

    useEffect(() => {
        if (!hasValidParams) {
            return;
        }

        let cancelled = false;

        verifyClinicEmail({
            id: Number(idParam),
            hash,
            expires: Number(expiresParam),
            signature,
        })
            .then(() => {
                if (!cancelled) setOutcome('confirmed');
            })
            .catch(() => {
                if (!cancelled) setOutcome('invalid');
            });

        return () => {
            cancelled = true;
        };
    }, [hasValidParams, idParam, hash, expiresParam, signature]);

    useEffect(() => {
        if (wait <= 0) return;
        const timer = setTimeout(() => setWait((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [wait]);

    const toLogin = () => navigate('/clinica/login');
    const currentOutcome: VerifyOutcome = !hasValidParams ? 'invalid' : outcome;

    if (currentOutcome === 'loading') {
        return (
            <AuthLayout
                title="Confirmando seu e-mail..."
                subtitle="Aguarde um instante enquanto validamos seu acesso."
            >
                <p className="text-center text-ds-body-xs text-ds-content-secondary">
                    Validando link de confirmação...
                </p>
            </AuthLayout>
        );
    }

    if (currentOutcome === 'confirmed') {
        return (
            <AuthLayout
                title="E-mail confirmado"
                subtitle="Pronto. Agora você já pode entrar no painel da clínica."
            >
                <div className="flex flex-col items-center gap-4 text-center">
                    <span className="flex size-14 items-center justify-center rounded-ds-full bg-ds-status-success-surface text-ds-status-success-content">
                        <CheckCircle2 className="size-7" />
                    </span>
                    <DsButton size="full" label="Entrar" onClick={toLogin} />
                </div>
            </AuthLayout>
        );
    }

    const onSubmitResend = handleSubmit(async ({ email }) => {
        setResendError(null);
        setResendMessage(null);
        try {
            await resendClinicVerification(email);
            setResendMessage(
                'Se houver um cadastro pendente com este e-mail, enviamos um novo link de confirmação.',
            );
            setWait(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            setResendError(
                authErrorMessage(
                    err,
                    'Não foi possível reenviar o link agora. Tente de novo.',
                ),
            );
        }
    });

    return (
        <AuthLayout
            title="Link inválido ou expirado"
            subtitle="Este link de confirmação venceu ou está incompleto. Informe o e-mail da conta para receber um novo."
        >
            <form
                onSubmit={onSubmitResend}
                className="flex flex-col gap-5"
                noValidate
            >
                {resendMessage && (
                    <DsAlert variant="success" mode="compact">
                        {resendMessage}
                    </DsAlert>
                )}
                {resendError && (
                    <DsAlert variant="danger" mode="compact">
                        {resendError}
                    </DsAlert>
                )}
                <DsInput
                    type="email"
                    label="E-mail da conta"
                    placeholder="voce@clinica.com"
                    autocomplete="email"
                    state={errors.email ? 'error' : 'default'}
                    helper={errors.email?.message}
                    {...register('email')}
                />
                <DsButton
                    type="submit"
                    size="full"
                    label={
                        wait > 0
                            ? `Reenviar em ${wait} s`
                            : 'Reenviar e-mail de confirmação'
                    }
                    disabled={wait > 0}
                    loading={isSubmitting}
                />
            </form>
            <TextLink onClick={toLogin} className="self-center text-ds-caption">
                Voltar para o login
            </TextLink>
        </AuthLayout>
    );
}
