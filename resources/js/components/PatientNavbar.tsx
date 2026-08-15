import { Activity, ArrowLeft, LogIn, LogOut, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { patientLoginPathWithNext } from '@/application/patient/patient-auth-paths';
import {
    isPatientProgramsListPath,
    patientProgramsListPath,
} from '@/application/patient/patient-program-paths';
import { Button } from '@/components/ui/button';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/ui/avatar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { isPatientAreaPath } from '@/infrastructure/api/client';
import { cn } from '@/lib/utils';

interface PatientNavbarProps {
    title?: string;
    current?: number;
    total?: number;
    onBack?: () => void;
    hideAuthAction?: boolean;
}

export function PatientNavbar({
    title,
    current,
    total,
    onBack,
    hideAuthAction = false,
}: PatientNavbarProps) {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicSlug } = useParams<{ clinicSlug?: string }>();
    const { isAuthenticated, guard, user, logout, isLoading } = useAuth();

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const isContextMode = !!title;
    const isPatientArea = isPatientAreaPath(location.pathname);
    const isPatientLogged = isAuthenticated && guard === 'patient';
    const isRestoringSession = isLoading && isPatientArea;
    const isOnProgramList =
        !!clinicSlug && isPatientProgramsListPath(location.pathname);

    const goToProgramList = () => {
        if (clinicSlug) {
            navigate(patientProgramsListPath(clinicSlug));
        }
    };

    const goToLogin = () => {
        const current = `${location.pathname}${location.search}`;
        navigate(patientLoginPathWithNext(clinicSlug, current));
    };

    const handleLogout = async () => {
        try {
            await logout('patient');
        } finally {
            navigate(
                clinicSlug
                    ? `/${clinicSlug}/paciente/programas`
                    : '/paciente/login',
                { replace: true },
            );
        }
    };

    const firstName = user?.name?.split(' ')[0] ?? 'Paciente';

    return (
        <header className="sticky top-0 z-30 border-b border-border bg-card/80 shadow-2xs backdrop-blur-md transition-colors">
            <div className="mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (!isOnProgramList) goToProgramList();
                        }}
                        disabled={isOnProgramList || !clinicSlug}
                        aria-label={
                            isOnProgramList
                                ? 'FisioKine'
                                : 'Ir para meus programas'
                        }
                        className={cn(
                            'flex shrink-0 items-center gap-3 rounded-xl border-0 bg-transparent p-0 text-left',
                            !isOnProgramList &&
                                clinicSlug &&
                                'cursor-pointer transition-colors hover:opacity-80',
                        )}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                            <Activity className="h-5.5 w-5.5 stroke-[2.2]" />
                        </div>
                        <div className="hidden sm:block">
                            <span className="font-sans text-base font-semibold tracking-tight text-foreground">
                                FisioKine
                            </span>
                        </div>
                    </button>

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

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {isContextMode &&
                        current !== undefined &&
                        total !== undefined && (
                            <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
                                {current}/{total}
                            </span>
                        )}

                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        title={isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
                        className="cursor-pointer rounded-lg border border-transparent p-2 text-muted-foreground transition-all hover:border-border hover:bg-secondary hover:text-foreground"
                    >
                        {isDarkMode ? (
                            <Sun className="h-4.5 w-4.5" />
                        ) : (
                            <Moon className="h-4.5 w-4.5" />
                        )}
                    </button>

                    {hideAuthAction ? null : isRestoringSession ? (
                        <div
                            aria-hidden
                            className="h-9 w-24 animate-pulse rounded-lg bg-muted"
                        />
                    ) : isPatientLogged ? (
                        <Popover>
                            <PopoverTrigger asChild>
                                <button
                                    aria-label="Menu do paciente"
                                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                                >
                                    <Avatar className="h-6 w-6">
                                        {user.photoUrl ? (
                                            <AvatarImage
                                                src={user.photoUrl}
                                                alt={user.name}
                                            />
                                        ) : null}
                                        <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                                            {firstName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden max-w-[8rem] truncate sm:inline">
                                        {firstName}
                                    </span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent
                                align="end"
                                className="w-56 bg-popover p-1.5"
                            >
                                <div className="px-2.5 py-2">
                                    <p className="truncate text-sm font-medium text-foreground">
                                        {user?.name}
                                    </p>
                                    {user?.email && (
                                        <p className="truncate text-xs text-muted-foreground">
                                            {user.email}
                                        </p>
                                    )}
                                </div>
                                <div className="my-1 h-px bg-border" />
                                <button
                                    onClick={() => void handleLogout()}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Sair
                                </button>
                            </PopoverContent>
                        </Popover>
                    ) : (
                        <button
                            onClick={goToLogin}
                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/90"
                        >
                            <LogIn className="h-4 w-4" />
                            <span className="hidden sm:inline">Entrar</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
