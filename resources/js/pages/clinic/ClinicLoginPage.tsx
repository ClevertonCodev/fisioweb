import { Activity, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function ClinicLoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: { preventDefault(): void }) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login('clinic', { email, password });
            navigate('/clinica', { replace: true });
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : null;
            setError(message || 'Erro ao entrar. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
            {/* Decorative background */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -right-40 -bottom-40 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl"
            />

            {/* Card */}
            <div className="relative z-10 w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 shadow-sm shadow-primary/10">
                        <Activity className="h-7 w-7 text-primary" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        FisioClinic
                    </span>
                </div>

                <div className="rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-10">
                    <div className="mb-6 text-center">
                        <h1 className="text-2xl font-bold text-foreground">
                            Bem-vindo de volta
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Acesse o painel da sua clínica
                        </p>
                    </div>

                    {/* Google */}
                    <Button
                        variant="outline"
                        className="h-12 w-full gap-2 rounded-xl text-sm font-medium"
                        type="button"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continuar com Google
                    </Button>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                            ou
                        </span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-xl border-border bg-background pl-11 text-base placeholder:text-muted-foreground/60"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 rounded-xl border-border bg-background px-11 text-base placeholder:text-muted-foreground/60"
                                required
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

                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() =>
                                    navigate('/clinica/recuperar-senha')
                                }
                                className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                            >
                                Esqueci minha senha
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
                                    Entrando...
                                </div>
                            ) : (
                                'Acessar'
                            )}
                        </Button>
                    </form>
                </div>

                <div className="mt-6 space-y-1 text-center">
                    <p className="text-sm text-muted-foreground">
                        Não possui uma conta?{' '}
                        <button className="font-semibold text-primary transition-colors hover:text-primary/80">
                            Criar conta
                        </button>
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Precisa de ajuda?{' '}
                        <button className="font-semibold text-primary transition-colors hover:text-primary/80">
                            Falar com suporte
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
