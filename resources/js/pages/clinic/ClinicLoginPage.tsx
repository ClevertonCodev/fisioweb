import { Activity, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import loginBg from '@/assets/login-bg.jpg';
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
                    ? (err as { response?: { data?: { message?: string } } }).response?.data
                          ?.message
                    : null;
            setError(message || 'Erro ao entrar. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Left side - Form */}
            <div className="bg-card flex w-full flex-col items-center justify-center px-8 py-12 md:w-[440px] lg:w-[480px]">
                {/* Logo */}
                <div className="mb-8 flex items-center gap-2">
                    <div className="bg-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-xl border">
                        <Activity className="text-primary h-5 w-5" />
                    </div>
                    <span className="text-foreground text-xl font-bold tracking-tight">
                        FisioClinic
                    </span>
                </div>

                <h1 className="text-foreground mb-8 text-2xl font-bold">Entrar</h1>

                {/* Social buttons */}
                <div className="flex w-full max-w-[340px] items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 flex-1 gap-2 rounded-xl text-sm font-medium"
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
                        Google
                    </Button>

                    <Button
                        variant="outline"
                        className="h-12 flex-1 gap-2 rounded-xl text-sm font-medium"
                        type="button"
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Meta
                    </Button>
                </div>

                <div className="my-4 flex w-full max-w-[340px] items-center gap-3">
                    <div className="bg-border h-px flex-1" />
                    <span className="text-muted-foreground text-xs font-medium uppercase">ou</span>
                    <div className="bg-border h-px flex-1" />
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="w-full max-w-[340px] space-y-4">
                    {error && (
                        <div className="bg-destructive/10 border-destructive/20 text-destructive rounded-lg border px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <Input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-background border-border placeholder:text-muted-foreground/60 h-12 rounded-xl text-base"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-background border-border placeholder:text-muted-foreground/60 h-12 rounded-xl pr-12 text-base"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-4 -translate-y-1/2 transition-colors"
                        >
                            {showPassword ? (
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
                                <div className="border-primary-foreground/30 border-t-primary-foreground h-4 w-4 animate-spin rounded-full border-2" />
                                Entrando...
                            </div>
                        ) : (
                            'Acessar'
                        )}
                    </Button>
                </form>

                <button
                    type="button"
                    onClick={() => navigate('/clinica/recuperar-senha')}
                    className="text-primary hover:text-primary/80 mt-4 text-sm font-medium transition-colors"
                >
                    Esqueci minha senha
                </button>

                <div className="mt-8 space-y-1 text-center">
                    <p className="text-muted-foreground text-sm">
                        Não possui uma conta?{' '}
                        <button className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Criar conta
                        </button>
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Precisa de ajuda?{' '}
                        <button className="text-primary hover:text-primary/80 font-semibold transition-colors">
                            Falar com suporte
                        </button>
                    </p>
                </div>
            </div>

            {/* Right side - Hero */}
            <div className="relative hidden flex-1 items-center justify-center overflow-hidden md:flex">
                <img src={loginBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="bg-primary/60 absolute inset-0" />

                <div className="relative z-10 max-w-xl px-12 text-center">
                    <h2 className="text-primary-foreground mb-6 font-serif text-4xl font-bold italic lg:text-5xl">
                        Você sempre à frente
                    </h2>

                    {/* Avatars row */}
                    <div className="mb-3 flex items-center justify-center gap-1">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div
                                key={i}
                                className="border-primary-foreground/40 bg-primary-foreground/20 -ml-2 h-10 w-10 rounded-full border-2 first:ml-0"
                            />
                        ))}
                        <span className="text-primary-foreground ml-3 text-sm font-semibold">
                            +20.000 profissionais da saúde
                        </span>
                    </div>

                    <p className="text-primary-foreground/90 mt-4 text-base">
                        Facilite sua vida. Tenha todas as ferramentas que precisa em um só lugar!
                    </p>
                </div>
            </div>
        </div>
    );
}
