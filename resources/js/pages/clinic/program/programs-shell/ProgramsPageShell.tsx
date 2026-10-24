import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { DsButton, dsCn, DsTabs } from '@/components/ds';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import {
    PROGRAMS_TABS,
    programsTabFromPath,
    programsTabPath,
    useLastProgramsPaths,
    type ProgramsTabKey,
} from './programs-tabs';

const NEW_PROGRAM_PATH = '/clinica/programas/novo';

export function ProgramsPageShell({
    subtitle,
    extraActions,
    filters,
    chips,
    children,
    hideTabs = false,
    hideCreateProgram = false,
}: {
    subtitle: ReactNode;
    extraActions?: ReactNode;
    filters: ReactNode;
    chips: ReactNode;
    children: ReactNode;
    hideTabs?: boolean;
    /** Rota do menu Exercícios: biblioteca sem criar programa no cabeçalho. */
    hideCreateProgram?: boolean;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isMobile = useIsMobile();
    const tab = programsTabFromPath(location.pathname);
    const lastPaths = useLastProgramsPaths();

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Programas e exercícios
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {subtitle}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {extraActions}
                                {!hideCreateProgram && (
                                    <>
                                        <div className="sm:hidden">
                                            <DsButton
                                                iconPosition="only"
                                                icon={<Plus />}
                                                label="Criar programa"
                                                onClick={() =>
                                                    navigate(NEW_PROGRAM_PATH)
                                                }
                                            />
                                        </div>
                                        <div className="hidden sm:block">
                                            <DsButton
                                                iconPosition="left"
                                                icon={<Plus />}
                                                label="Criar programa"
                                                onClick={() =>
                                                    navigate(NEW_PROGRAM_PATH)
                                                }
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </header>

                        <section
                            aria-label="Seções, busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
                        >
                            {!hideTabs && (
                                <div className="-mx-3 border-b border-ds-border-subtle px-1.5 pb-3 sm:-mx-4 sm:px-4 sm:pb-4">
                                    <div className="w-full max-w-md">
                                        <DsTabs
                                            aria-label="Seções de programas"
                                            size={isMobile ? 'sm' : 'md'}
                                            tabs={[...PROGRAMS_TABS]}
                                            value={tab}
                                            onValueChange={(key) => {
                                                const path = programsTabPath(
                                                    key as ProgramsTabKey,
                                                    location.pathname,
                                                    lastPaths.programas,
                                                    lastPaths.historico,
                                                );
                                                if (
                                                    path !== location.pathname
                                                ) {
                                                    navigate(path);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            {filters}
                            <div
                                className={dsCn(
                                    'flex min-h-8 items-center',
                                    'max-sm:empty:hidden',
                                )}
                            >
                                {chips}
                            </div>
                        </section>

                        {children}
                    </div>
                </div>
            </div>
        </ClinicLayout>
    );
}
