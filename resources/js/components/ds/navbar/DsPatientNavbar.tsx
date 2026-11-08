import { ArrowLeft, LogIn, LogOut } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { patientLoginPathWithNext } from '@/application/patient/patient-auth-paths';
import {
    isPatientProgramsListPath,
    patientProgramsListPath,
} from '@/application/patient/patient-program-paths';
import { AppLogo } from '@/components/AppLogo';
import { DsBadge } from '@/components/ds/badge/DsBadge';
import { DsButton } from '@/components/ds/button/DsButton';
import { DsThemeToggle } from '@/components/ds/theme/DsThemeToggle';
import { dsCn } from '@/components/ds/utils/ds-cn';
import { useAuth } from '@/contexts/AuthContext';
import { isPatientAreaPath } from '@/infrastructure/api/client';

export interface DsPatientNavbarProps {
    title?: string;
    current?: number;
    total?: number;
    onBack?: () => void;
    hideAuthAction?: boolean;
    clinicName?: string;
    className?: string;
}

export function DsPatientNavbar({
    title,
    current,
    total,
    onBack,
    hideAuthAction = false,
    clinicName,
    className,
}: DsPatientNavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { clinicSlug } = useParams<{ clinicSlug?: string }>();
    const { isAuthenticated, guard, user, logout, isLoading } = useAuth();

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
        const target = `${location.pathname}${location.search}`;
        navigate(patientLoginPathWithNext(clinicSlug, target));
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
    const displayClinic = clinicName;

    return (
        <header
            className={dsCn(
                'sticky top-0 z-30 border-b border-ds-border-subtle bg-ds-surface-default/90 font-ds backdrop-blur-md transition-colors',
                className,
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                {/* Brand / Title */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (!isOnProgramList) goToProgramList();
                        }}
                        disabled={isOnProgramList || !clinicSlug}
                        aria-label={
                            isOnProgramList
                                ? 'IVS Fisioterapia e Saúde — Área do Paciente'
                                : 'Ir para meus programas'
                        }
                        className={dsCn(
                            'group flex shrink-0 items-center gap-2.5 rounded-ds-md border-0 bg-transparent p-1 text-left transition-opacity',
                            !isOnProgramList &&
                                clinicSlug &&
                                'cursor-pointer hover:opacity-85',
                        )}
                    >
                        <AppLogo className="size-8 transition-transform group-hover:scale-105 ds-dark:text-ds-white" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-ds text-ds-body-sm font-semibold tracking-tight text-ds-primary-80 ds-dark:text-ds-white">
                                IVS
                            </span>
                            <span className="hidden font-ds-mono text-[10px] tracking-wider text-ds-content-muted uppercase sm:inline">
                                Fisioterapia e Saúde
                            </span>
                        </div>
                    </button>

                    {displayClinic && (
                        <div className="hidden items-center gap-1.5 md:flex">
                            <span className="text-ds-content-subtle">·</span>
                            <DsBadge
                                variant="default"
                                className="text-ds-caption capitalize"
                            >
                                {displayClinic}
                            </DsBadge>
                        </div>
                    )}

                    {isContextMode && (
                        <>
                            <DsButton
                                variant="tertiary"
                                size="sm"
                                iconPosition="only"
                                icon={<ArrowLeft className="size-4" />}
                                label="Voltar"
                                onClick={onBack}
                                className="shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="truncate font-ds text-ds-body-xs font-medium text-ds-content-primary">
                                    {title}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Right controls */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {isContextMode &&
                        current !== undefined &&
                        total !== undefined && (
                            <span className="hidden font-ds-mono text-ds-caption text-ds-content-subtle tabular-nums sm:inline">
                                {current}/{total}
                            </span>
                        )}

                    <DsThemeToggle />

                    {hideAuthAction ? null : isRestoringSession ? (
                        <div
                            aria-hidden
                            className="h-9 w-24 animate-pulse rounded-ds-md bg-ds-surface-subtle"
                        />
                    ) : isPatientLogged ? (
                        <div className="flex items-center gap-2">
                            <div className="hidden text-right text-ds-caption sm:block">
                                <p className="leading-tight font-medium text-ds-content-primary">
                                    {firstName}
                                </p>
                                <p className="text-[11px] leading-tight text-ds-content-muted">
                                    Paciente
                                </p>
                            </div>
                            <DsButton
                                variant="secondary"
                                size="sm"
                                iconPosition="left"
                                icon={<LogOut className="size-3.5" />}
                                label="Sair"
                                onClick={() => void handleLogout()}
                            />
                        </div>
                    ) : (
                        <DsButton
                            variant="primary"
                            size="sm"
                            iconPosition="left"
                            icon={<LogIn className="size-3.5" />}
                            label="Entrar"
                            onClick={goToLogin}
                        />
                    )}
                </div>
            </div>
        </header>
    );
}
