import { Activity, RefreshCw, Sparkles } from 'lucide-react';
import { useMemo } from 'react';

import { DsButton, DsPatientNavbar, dsCn } from '@/components/ds';

import {
    formatProgramPeriod,
    PatientProgramStatusBadge,
    ProgramListEmpty,
    ProgramListLoading,
    programSlug,
    totalExercises,
    type ProgramListViewProps,
} from './shared';

export const VARIANT_C_NAME = 'Hero e cards';

export function VariantC({
    clinicSlug,
    programs,
    isLoading,
    isRefetching,
    onRefresh,
    onOpenProgram,
}: ProgramListViewProps) {
    const activeCount = useMemo(
        () =>
            programs?.filter(
                (p) => p.status === 'available' || p.status === 'scheduled',
            ).length ?? 0,
        [programs],
    );

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar showPrototypeBadge />

            <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                <section className="relative overflow-hidden rounded-ds-2xl border border-ds-border-brand-subtle bg-[image:var(--ds-gradient-brand)] p-6 shadow-ds-sm sm:p-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-ds-white/20 blur-2xl"
                    />
                    <div className="relative flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-md space-y-2">
                            <div className="inline-flex items-center gap-1.5 rounded-ds-pill bg-ds-white/15 px-2.5 py-0.5 text-ds-caption font-medium text-ds-white">
                                <Sparkles className="size-3.5" />
                                Área do paciente
                            </div>
                            <h1 className="text-ds-h3 font-semibold tracking-tight text-ds-white sm:text-ds-h2">
                                Meus programas
                            </h1>
                            <p className="text-ds-body-sm text-ds-white/90">
                                {isLoading
                                    ? 'Carregando sua lista…'
                                    : activeCount > 0
                                      ? `${activeCount} ${activeCount === 1 ? 'programa ativo' : 'programas ativos'} para você seguir em casa.`
                                      : 'Acompanhe aqui os programas prescritos pelo seu profissional.'}
                            </p>
                        </div>
                        <DsButton
                            variant="secondary"
                            size="sm"
                            iconPosition="only"
                            icon={
                                <RefreshCw
                                    className={dsCn(
                                        'size-4',
                                        isRefetching && 'animate-spin',
                                    )}
                                />
                            }
                            label="Atualizar lista"
                            className="border-ds-white/40 bg-ds-white/10 text-ds-white enabled:hover:border-ds-white enabled:hover:bg-ds-white/20 enabled:hover:text-ds-white"
                            onClick={onRefresh}
                            disabled={isRefetching}
                        />
                    </div>
                </section>

                {isLoading ? (
                    <ProgramListLoading />
                ) : !programs?.length ? (
                    <ProgramListEmpty />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {programs.map((program) => {
                            const slug = programSlug(clinicSlug, program);
                            const count = totalExercises(program);

                            return (
                                <button
                                    key={program.publicToken}
                                    type="button"
                                    disabled={!slug}
                                    onClick={() => {
                                        if (!slug) return;
                                        onOpenProgram(program.publicToken);
                                    }}
                                    className="flex h-full cursor-pointer flex-col rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 text-left shadow-ds-xs transition-all hover:border-ds-primary-80 hover:shadow-ds-sm focus-visible:shadow-ds-focus focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <div className="mb-3 flex items-start justify-between gap-2">
                                        <h2 className="line-clamp-2 text-ds-body-sm font-semibold text-ds-content-primary">
                                            {program.name}
                                        </h2>
                                        <PatientProgramStatusBadge
                                            status={program.status}
                                        />
                                    </div>

                                    <div className="mt-auto space-y-2 text-ds-caption text-ds-content-muted">
                                        <div className="flex items-center gap-1.5 text-ds-body-xs">
                                            <Activity className="size-3.5 text-ds-content-brand" />
                                            {count}{' '}
                                            {count === 1
                                                ? 'exercício'
                                                : 'exercícios'}
                                        </div>
                                        <p className="line-clamp-1">
                                            {program.professionalName}
                                        </p>
                                        <p>{formatProgramPeriod(program)}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
