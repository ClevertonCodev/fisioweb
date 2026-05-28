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
                    ? (err as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : null;
            setError(message || 'Erro ao enviar o e-mail. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
            <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="bg-background/30 absolute inset-0 backdrop-blur-[2px]" />

            <div className="bg-card/70 border-border/40 relative z-10 flex w-[90%] max-w-[420px] flex-col items-center rounded-3xl border p-10 shadow-2xl backdrop-blur-xl">
                <div className="bg-primary/10 border-primary/20 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border">
                    <Shield className="text-primary h-8 w-8" />
                </div>

                <h1 className="text-foreground mb-1 text-2xl font-bold tracking-tight">
                    FisioClinic
                </h1>
                <h2 className="text-foreground mt-4 mb-2 font-serif text-2xl font-bold italic">
                    Recuperar Senha
                </h2>
                <p className="text-muted-foreground mb-8 text-center text-sm">
                    Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>

                {success ? (
                    <div className="w-full space-y-4">
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
                            E-mail de recuperação enviado. Verifique sua caixa de entrada.
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
                            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="text-primary/60 absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background/50 border-border/50 placeholder:text-muted-foreground/60 focus:bg-background/80 h-12 rounded-2xl pl-11 text-base transition-colors"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="shadow-primary/25 h-12 w-full rounded-2xl text-base font-semibold shadow-lg transition-all duration-300"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
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
                                className="text-muted-foreground hover:text-primary text-sm font-medium transition-colors"
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
