import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import {
    authErrorMessage,
    resendClinicVerification,
} from '@/application/clinic';
import {
    AuthLayout,
    PasswordInput,
    TextLink,
} from '@/components/clinic/auth/AuthLayout';
import { DsAlert, DsButton, DsInput } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
    email: z
        .string()
        .trim()
        .min(1, 'Informe o e-mail')
        .email('E-mail inválido'),
    password: z.string().min(1, 'Informe a senha'),
});

type LoginForm = z.infer<typeof schema>;

export default function ClinicLoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [resentMessage, setResentMessage] = useState<string | null>(null);
    const [resending, setResending] = useState(false);
    const {
        control,
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
    });

    const watchedEmail = useWatch({ control, name: 'email' }) ?? '';
    const isUnverifiedError = Boolean(
        error && /confirme seu e-mail/i.test(error),
    );

    const submit = handleSubmit(async ({ email, password }) => {
        setError(null);
        setResentMessage(null);
        try {
            await login('clinic', {
                email: email ?? '',
                password: password ?? '',
            });
            navigate('/clinica', { replace: true });
        } catch (err) {
            setError(
                authErrorMessage(
                    err,
                    'Não foi possível entrar. Tente de novo.',
                ),
            );
        }
    });

    const handleResendVerification = async () => {
        const targetEmail = watchedEmail.trim();
        if (!targetEmail || resending) return;

        setResending(true);
        try {
            await resendClinicVerification(targetEmail);
            setResentMessage(
                `Enviamos um novo link de confirmação para ${targetEmail}.`,
            );
        } catch (err) {
            setError(
                authErrorMessage(
                    err,
                    'Não foi possível reenviar o link agora. Tente de novo.',
                ),
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <AuthLayout
            title="Bem-vindo de volta"
            subtitle="Entre para ver a agenda e os pacientes da clínica."
            footer={
                <p className="text-center text-ds-body-xs text-ds-content-secondary">
                    Ainda não tem conta?{' '}
                    <TextLink
                        onClick={() => navigate('/clinica/criar-conta')}
                        className="font-semibold"
                    >
                        Criar conta da clínica
                    </TextLink>
                </p>
            }
        >
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {error && (
                    <div className="flex flex-col gap-2">
                        <DsAlert variant="danger" mode="compact">
                            {error}
                        </DsAlert>
                        {isUnverifiedError && (
                            <TextLink
                                onClick={() => void handleResendVerification()}
                                className="self-start text-ds-caption"
                            >
                                Reenviar e-mail de confirmação
                            </TextLink>
                        )}
                    </div>
                )}
                {resentMessage && (
                    <DsAlert variant="success" mode="compact">
                        {resentMessage}
                    </DsAlert>
                )}
                <DsInput
                    type="email"
                    label="E-mail"
                    placeholder="voce@clinica.com"
                    autocomplete="email"
                    state={errors.email ? 'error' : 'default'}
                    helper={errors.email?.message}
                    {...register('email')}
                />
                <div className="flex flex-col gap-2">
                    <PasswordInput
                        label="Senha"
                        placeholder="Sua senha"
                        autocomplete="current-password"
                        state={errors.password ? 'error' : 'default'}
                        helper={errors.password?.message}
                        {...register('password')}
                    />
                    <TextLink
                        onClick={() => navigate('/clinica/recuperar-senha')}
                        className="self-end text-ds-caption"
                    >
                        Esqueci minha senha
                    </TextLink>
                </div>
                <DsButton
                    type="submit"
                    size="full"
                    label="Entrar"
                    loading={isSubmitting}
                />
            </form>
        </AuthLayout>
    );
}
