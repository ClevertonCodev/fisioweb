import { Activity, ArrowLeft, LogIn, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PatientNavbarProps {
    title?: string;
    current?: number;
    total?: number;
    onBack?: () => void;
}

export function PatientNavbar({
    title,
    current,
    total,
    onBack,
}: PatientNavbarProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const isContextMode = !!title;

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md transition-colors shadow-2xs">
            <div className="mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Logo/Brand (sempre visível) */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
                            <Activity className="w-5.5 h-5.5 stroke-[2.2]" />
                        </div>
                        <div className="hidden sm:block">
                            <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground tracking-tight text-base font-sans">
                                    FisioKine
                                </span>
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    Paciente
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Context Mode: Back button + Title (centro) */}
                    {isContextMode && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-muted-foreground hover:text-foreground"
                                onClick={onBack}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="min-w-0">
                                <p className="truncate font-serif text-sm text-muted-foreground">
                                    {title}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Actions (direita) */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Counter */}
                    {isContextMode &&
                        current !== undefined &&
                        total !== undefined && (
                            <span className="font-mono text-xs text-muted-foreground tabular-nums hidden sm:inline">
                                {current}/{total}
                            </span>
                        )}

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all cursor-pointer"
                    >
                        {isDarkMode ? (
                            <Sun className="w-4.5 h-4.5" />
                        ) : (
                            <Moon className="w-4.5 h-4.5" />
                        )}
                    </button>

                    {/* Login Button */}
                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
                    >
                        <LogIn className="w-4 h-4" />
                        <span className="hidden sm:inline">Entrar</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
