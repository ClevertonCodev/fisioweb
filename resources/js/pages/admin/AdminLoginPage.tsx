import { Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import loginBg from '@/assets/login-bg.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login('admin', { email, password });
            navigate('/admin', { replace: true });
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
                    Painel Administrativo
                </h2>
                <p className="mb-8 text-sm text-muted-foreground">
                    Acesso restrito a administradores
                </p>

                <form onSubmit={handleLogin} className="w-full space-y-4">
                    {error && (
                        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}
                    <div className="relative">
                        <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-primary/60" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-2xl border-border/50 bg-background/50 pl-11 text-base transition-colors placeholder:text-muted-foreground/60 focus:bg-background/80"
                            required
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-primary/60" />
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 rounded-2xl border-border/50 bg-background/50 pr-12 pl-11 text-base transition-colors placeholder:text-muted-foreground/60 focus:bg-background/80"
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

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 transition-all duration-300"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                                Entrando...
                            </div>
                        ) : (
                            'Entrar'
                        )}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/recuperar-senha')}
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                </form>

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/clinica/login')}
                        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                        Área da Clínica
                    </button>
                </div>
            </div>
        </div>
    );
}
