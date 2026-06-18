import { Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import loginBg from '@/assets/login-bg.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { forgotPassword } from '@/infrastructure/api/auth.service';

export default function AdminForgotPasswordPage() {
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
            await forgotPassword('admin', email);
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
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <img
                src={loginBg}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px]" />

            <div className="relative z-10 flex w-[90%] max-w-[420px] flex-col items-center rounded-3xl border border-border/40 bg-card/70 p-10 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
                    <Shield className="h-8 w-8 text-primary" />
                </div>

                <h1 className="mb-1 text-2xl font-bold tracking-tight text-foreground">
                    FisioClinic
                </h1>
                <h2 className="mt-4 mb-2 font-serif text-2xl font-bold text-foreground italic">
                    Recuperar Senha
                </h2>
                <p className="mb-8 text-center text-sm text-muted-foreground">
                    Informe seu e-mail e enviaremos um link para redefinir sua
                    senha.
                </p>

                {success ? (
                    <div className="w-full space-y-4">
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
                            E-mail de recuperação enviado. Verifique sua caixa
                            de entrada.
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-12 w-full rounded-2xl text-base"
                            onClick={() => navigate('/admin/login')}
                        >
                            Voltar ao login
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="w-full space-y-4">
                        {error && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-primary/60" />
                            <Input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 rounded-2xl border-border/50 bg-background/50 pl-11 text-base transition-colors placeholder:text-muted-foreground/60 focus:bg-background/80"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300"
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

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/login')}
                                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                Voltar ao login
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
