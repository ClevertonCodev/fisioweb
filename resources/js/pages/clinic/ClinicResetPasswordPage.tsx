import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import {
    authErrorMessage,
    isExpiredResetLink,
    resetClinicPassword,
} from '@/application/clinic';
import {
    AuthLayout,
    PasswordInput,
    TextLink,
} from '@/components/clinic/auth/AuthLayout';
import { DsAlert, DsButton } from '@/components/ds';

/** A API pede no mínimo 8 caracteres e a confirmação igual. */
const schema = z
    .object({
        password: z.string().min(8, 'Use pelo menos 8 caracteres'),
        confirmation: z.string().min(1, 'Repita a senha'),
    })
    .refine((v) => v.password === v.confirmation, {
        path: ['confirmation'],
        message: 'As senhas não são iguais',
    });

type ResetForm = z.infer<typeof schema>;

type Outcome = 'form' | 'done' | 'expired';

export default function ClinicResetPasswordPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const token = params.get('token') ?? '';
    const email = params.get('email') ?? '';
    const [outcome, setOutcome] = useState<Outcome>('form');
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetForm>({
        resolver: zodResolver(schema),
        defaultValues: { password: '', confirmation: '' },
    });

    const toLogin = () => navigate('/clinica/login');
    const toRecover = () => navigate('/clinica/recuperar-senha');

    if (!token || !email || outcome === 'expired') {
        return (
            <AuthLayout
                title="Link inválido"
                subtitle={
                    outcome === 'expired'
                        ? 'Este link venceu ou já foi usado. Peça outro para criar a senha nova.'
                        : 'O link está incompleto. Abra de novo pelo e-mail ou peça outro.'
                }
            >
                <DsButton
                    size="full"
                    label="Pedir outro link"
                    onClick={toRecover}
                />
                <TextLink
                    onClick={toLogin}
                    className="self-center text-ds-caption"
                >
                    Voltar para o login
                </TextLink>
            </AuthLayout>
        );
    }

    if (outcome === 'done') {
        return (
            <AuthLayout
                title="Senha criada"
                subtitle="Pronto. Agora é só entrar com a senha nova."
            >
                <DsButton size="full" label="Entrar" onClick={toLogin} />
            </AuthLayout>
        );
    }

    const submit = handleSubmit(async ({ password, confirmation }) => {
        setError(null);
        try {
            await resetClinicPassword({
                token,
                email,
                password: password ?? '',
                passwordConfirmation: confirmation ?? '',
            });
            setOutcome('done');
        } catch (err) {
            if (isExpiredResetLink(err)) {
                setOutcome('expired');
                return;
            }
            setError(
                authErrorMessage(
                    err,
                    'Não foi possível criar a senha agora. Tente de novo.',
                ),
            );
        }
    });

    return (
        <AuthLayout
            title="Criar senha nova"
            subtitle={`Para a conta ${email}.`}
        >
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {error && (
                    <DsAlert variant="danger" mode="compact">
                        {error}
                    </DsAlert>
                )}
                <PasswordInput
                    label="Senha nova"
                    placeholder="Pelo menos 8 caracteres"
                    autocomplete="new-password"
                    autoFocus
                    state={errors.password ? 'error' : 'default'}
                    helper={errors.password?.message}
                    {...register('password')}
                />
                <PasswordInput
                    label="Repita a senha nova"
                    placeholder="A mesma senha"
                    autocomplete="new-password"
                    state={errors.confirmation ? 'error' : 'default'}
                    helper={errors.confirmation?.message}
                    {...register('confirmation')}
                />
                <DsButton
                    type="submit"
                    size="full"
                    label="Criar senha"
                    loading={isSubmitting}
                />
            </form>
        </AuthLayout>
    );
}
