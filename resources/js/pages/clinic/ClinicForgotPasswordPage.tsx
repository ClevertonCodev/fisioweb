import { Activity, CheckCircle2, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPassword } from '@/infrastructure/api/auth.service';

export default function ClinicForgotPasswordPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await forgotPassword('clinic', email);
            setSuccess(true);
        } catch (err: unknown) {
            const message =
                err && typeof err === 'object' && 'response' in err
                    ? (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message
                    : null;
            setError(message || 'Erro ao enviar o e-mail. Tente novamente.');
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
                            Recuperar senha
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Informe seu e-mail e enviaremos um link para
                            redefinir sua senha.
                        </p>
                    </div>

                    {success ? (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-6 text-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    E-mail de recuperação enviado. Verifique sua
                                    caixa de entrada.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl text-base"
                                onClick={() => navigate('/clinica/login')}
                            >
                                Voltar ao login
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
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

                            <Button
                                type="submit"
                                className="h-12 w-full rounded-xl text-base font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                        Enviando...
                                    </div>
                                ) : (
                                    'Enviar link de recuperação'
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="h-12 w-full rounded-xl text-base"
                                onClick={() => navigate('/clinica/login')}
                            >
                                Voltar ao login
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
