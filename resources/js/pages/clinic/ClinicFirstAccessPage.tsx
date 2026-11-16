import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';

import { authErrorMessage, isExpiredResetLink } from '@/application/clinic';
import {
    AuthLayout,
    PasswordInput,
    TextLink,
} from '@/components/clinic/auth/AuthLayout';
import { DsAlert, DsButton } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';

const schema = z
    .object({
        password: z.string().min(8, 'Use pelo menos 8 caracteres'),
        confirmation: z.string().min(1, 'Repita a senha'),
    })
    .refine((v) => v.password === v.confirmation, {
        path: ['confirmation'],
        message: 'As senhas não são iguais',
    });

type FirstAccessForm = z.infer<typeof schema>;

export default function ClinicFirstAccessPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const token = params.get('token') ?? '';
    const { completeFirstAccess } = useAuth();
    const [invalidLink, setInvalidLink] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FirstAccessForm>({
        resolver: zodResolver(schema),
        defaultValues: { password: '', confirmation: '' },
    });

    if (!token || invalidLink) {
        return (
            <AuthLayout
                title="Link inválido"
                subtitle="Este link está incompleto, já foi usado ou foi trocado por outro. Peça um novo link ao suporte."
            >
                <TextLink
                    onClick={() => navigate('/clinica/login')}
                    className="self-center text-ds-caption"
                >
                    Ir para o login
                </TextLink>
            </AuthLayout>
        );
    }

    const submit = handleSubmit(async ({ password, confirmation }) => {
        setError(null);
        try {
            await completeFirstAccess({
                token,
                password,
                passwordConfirmation: confirmation,
            });
            navigate('/clinica', { replace: true });
        } catch (err) {
            if (isExpiredResetLink(err)) {
                setInvalidLink(true);
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
            title="Criar sua senha"
            subtitle="Escolha a senha para entrar na clínica."
        >
            <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
                {error && (
                    <DsAlert variant="danger" mode="compact">
                        {error}
                    </DsAlert>
                )}
                <PasswordInput
                    label="Senha"
                    placeholder="Pelo menos 8 caracteres"
                    autocomplete="new-password"
                    autoFocus
                    state={errors.password ? 'error' : 'default'}
                    helper={errors.password?.message}
                    {...register('password')}
                />
                <PasswordInput
                    label="Repita a senha"
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
