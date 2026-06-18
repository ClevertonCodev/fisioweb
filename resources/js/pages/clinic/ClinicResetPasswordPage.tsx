import { Activity, Eye, EyeOff, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import loginBg from '@/assets/login-bg.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resetPassword } from '@/infrastructure/api/auth.service';

export default function ClinicResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const email = searchParams.get('email') ?? '';

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== passwordConfirmation) {
            setError('As senhas não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(
                'clinic',
                token,
                email,
                password,
                passwordConfirmation,
            );
            setSuccess(true);
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : null;
            setError(message || 'Erro ao redefinir a senha. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="flex min-h-screen flex-col md:flex-row">
                <div className="flex w-full flex-col items-center justify-center bg-card px-8 py-12 md:w-[440px] lg:w-[480px]">
                    <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
                        Link inválido ou expirado. Solicite um novo link de
                        recuperação.
                    </div>
                    <Button
                        type="button"
                        className="h-12 w-full max-w-[340px] rounded-xl text-base font-semibold"
                        onClick={() => navigate('/clinica/recuperar-senha')}
                    >
                        Solicitar novo link
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Left side - Form */}
            <div className="flex w-full flex-col items-center justify-center bg-card px-8 py-12 md:w-[440px] lg:w-[480px]">
                <div className="mb-8 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        FisioClinic
                    </span>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-foreground">
                    Redefinir senha
                </h1>
                <p className="mb-8 text-center text-sm text-muted-foreground">
                    Crie uma nova senha para sua conta.
                </p>

                {success ? (
                    <div className="w-full max-w-[340px] space-y-4">
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
                            Senha redefinida com sucesso!
                        </div>
                        <Button
                            type="button"
                            className="h-12 w-full rounded-xl text-base font-semibold"
                            onClick={() => navigate('/clinica/login')}
                        >
                            Ir para o login
                        </Button>
                    </div>
                ) : (
                    <form
                        onSubmit={handleSubmit}
                        className="w-full max-w-[340px] space-y-4"
                    >
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nova senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl border-border bg-background pr-12 pl-10 text-base placeholder:text-muted-foreground/60"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type={showConfirmation ? 'text' : 'password'}
                                placeholder="Confirmar nova senha"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                className="h-12 rounded-xl border-border bg-background pr-12 pl-10 text-base placeholder:text-muted-foreground/60"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmation(!showConfirmation)
                                }
                                className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {showConfirmation ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            className="h-12 w-full rounded-xl text-base font-semibold"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                    Salvando...
                                </div>
                            ) : (
                                'Redefinir senha'
                            )}
                        </Button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/clinica/login')}
                                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            >
                                Voltar ao login
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Right side - Hero */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden md:flex">
                <img
                    src={loginBg}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/60" />
                <div className="relative z-10 max-w-xl px-12 text-center">
                    <h2 className="mb-6 font-serif text-4xl font-bold text-primary-foreground italic lg:text-5xl">
                        Você sempre à frente
                    </h2>
                    <p className="mt-4 text-base text-primary-foreground/90">
                        Facilite sua vida. Tenha todas as ferramentas que
                        precisa em um só lugar!
                    </p>
                </div>
            </div>
        </div>
    );
}
