import { Activity, Mail } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import loginBg from '@/assets/login-bg.jpg';
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
                    ? (err as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : null;
            setError(message || 'Erro ao enviar o e-mail. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Left side - Form */}
            <div className="bg-card flex w-full flex-col items-center justify-center px-8 py-12 md:w-[440px] lg:w-[480px]">
                <div className="mb-8 flex items-center gap-2">
                    <div className="bg-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-xl border">
                        <Activity className="text-primary h-5 w-5" />
                    </div>
                    <span className="text-foreground text-xl font-bold tracking-tight">
                        FisioClinic
                    </span>
                </div>

                <h1 className="text-foreground mb-2 text-2xl font-bold">Recuperar senha</h1>
                <p className="text-muted-foreground mb-8 text-center text-sm">
                    Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>

                {success ? (
                    <div className="w-full max-w-[340px] space-y-4">
                        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-center text-sm text-green-700 dark:text-green-400">
                            E-mail de recuperação enviado. Verifique sua caixa de entrada.
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
                    <form onSubmit={handleSubmit} className="w-full max-w-[340px] space-y-4">
                        {error && (
                            <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-background border-border placeholder:text-muted-foreground/60 h-12 rounded-xl pl-10 text-base"
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
                                onClick={() => navigate('/clinica/login')}
                                className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                            >
                                Voltar ao login
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Right side - Hero */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden md:flex">
                <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="bg-primary/60 absolute inset-0" />
                <div className="relative z-10 max-w-xl px-12 text-center">
                    <h2 className="text-primary-foreground mb-6 font-serif text-4xl font-bold italic lg:text-5xl">
                        Você sempre à frente
                    </h2>
                    <p className="text-primary-foreground/90 mt-4 text-base">
                        Facilite sua vida. Tenha todas as ferramentas que precisa em um só lugar!
                    </p>
                </div>
            </div>
        </div>
    );
}
