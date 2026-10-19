import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { authErrorMessage } from '@/application/clinic';
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
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(schema),
        defaultValues: { email: '', password: '' },
    });

    const submit = handleSubmit(async ({ email, password }) => {
        setError(null);
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
                    <DsAlert variant="danger" mode="compact">
                        {error}
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
