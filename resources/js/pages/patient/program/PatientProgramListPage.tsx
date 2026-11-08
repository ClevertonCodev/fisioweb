import { Activity, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatPatientProgramDate } from '@/application/patient/patient-program-dates';
import { patientProgramDetailPath } from '@/application/patient/patient-program-paths';
import { usePatientPrograms } from '@/application/patient/use-patient-program';
import {
    DsBadge,
    DsButton,
    DsEmptyState,
    DsPatientNavbar,
    dsCn,
} from '@/components/ds';
import type { PatientProgram } from '@/domain/patient/program';

function totalExercises(program: PatientProgram): number {
    return (
        program.exerciseCount ??
        program.groups.reduce((acc, group) => acc + group.exercises.length, 0)
    );
}

function formatProgramPeriod(program: PatientProgram): string {
    return `${formatPatientProgramDate(program.startDate)} a ${formatPatientProgramDate(program.endDate)}`;
}

function PatientProgramStatusBadge({
    status,
}: {
    status: PatientProgram['status'];
}) {
    switch (status) {
        case 'available':
            return (
                <DsBadge variant="primary" className="shrink-0">
                    Disponível
                </DsBadge>
            );
        case 'scheduled':
            return (
                <DsBadge variant="warning" className="shrink-0">
                    Disponível em breve
                </DsBadge>
            );
        case 'unavailable':
            return (
                <DsBadge variant="default" className="shrink-0">
                    Indisponível
                </DsBadge>
            );
        case 'completed':
            return (
                <DsBadge variant="success" className="shrink-0">
                    Concluído
                </DsBadge>
            );
        case 'inactive':
            return (
                <DsBadge variant="default" className="shrink-0">
                    Inativo
                </DsBadge>
            );
        default:
            return null;
    }
}

function ProgramListLoading() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center text-ds-content-muted">
            <Loader2 className="mb-4 size-8 animate-spin text-ds-content-brand" />
            <p className="text-ds-body-xs">Carregando programas. Aguarde…</p>
        </div>
    );
}

function ProgramListEmpty() {
    return (
        <DsEmptyState
            variant="empty"
            icon={<Activity />}
            title="Nenhum programa disponível"
            description="Entre em contato com o profissional da saúde."
            className="py-8"
        />
    );
}

export default function PatientProgramListPage() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const navigate = useNavigate();
    const {
        data: programs,
        isLoading,
        refetch,
        isRefetching,
    } = usePatientPrograms();

    const activeCount = useMemo(
        () =>
            programs?.filter(
                (program) =>
                    program.status === 'available' ||
                    program.status === 'scheduled',
            ).length ?? 0,
        [programs],
    );

    const heroText = isLoading
        ? 'Carregando sua lista…'
        : activeCount > 0
          ? `${activeCount} ${activeCount === 1 ? 'programa ativo' : 'programas ativos'} para você seguir em casa.`
          : 'Acompanhe aqui os programas prescritos pelo seu profissional.';

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar />

            <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                <section className="relative overflow-hidden rounded-ds-2xl border border-ds-border-brand-subtle bg-[image:var(--ds-gradient-brand)] p-6 shadow-ds-sm sm:p-8">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-8 -right-8 size-40 rounded-full bg-ds-white/20 blur-2xl"
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
                                {heroText}
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
                            onClick={() => {
                                void refetch();
                            }}
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
                            const slug = clinicSlug || program.clinicSlug || '';
                            const count = totalExercises(program);

                            return (
                                <button
                                    key={program.publicToken}
                                    type="button"
                                    disabled={!slug}
                                    onClick={() => {
                                        if (!slug) return;
                                        navigate(
                                            patientProgramDetailPath(
                                                slug,
                                                program.publicToken,
                                            ),
                                        );
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
