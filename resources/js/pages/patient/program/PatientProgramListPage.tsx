import { Activity, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { patientProgramDetailPath } from '@/application/patient/patient-program-paths';
import { usePatientPrograms } from '@/application/patient/use-patient-program';
import { PatientNavbar } from '@/components/PatientNavbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import type { PatientProgram } from '@/domain/patient/program';

function PatientProgramStatusBadge({
    status,
}: {
    status: PatientProgram['status'];
}) {
    switch (status) {
        case 'available':
            return (
                <StatusBadge variant="active" className="shrink-0 whitespace-nowrap">
                    Disponível
                </StatusBadge>
            );
        case 'scheduled':
            return (
                <StatusBadge variant="warning" className="shrink-0 whitespace-nowrap">
                    Disponível em breve
                </StatusBadge>
            );
        case 'unavailable':
            return (
                <StatusBadge variant="neutral" className="shrink-0 whitespace-nowrap">
                    Indisponível
                </StatusBadge>
            );
        case 'completed':
            return (
                <StatusBadge variant="success" className="shrink-0 whitespace-nowrap">
                    Concluído
                </StatusBadge>
            );
        case 'inactive':
            return (
                <StatusBadge variant="neutral" className="shrink-0 whitespace-nowrap">
                    Inativo
                </StatusBadge>
            );
        default:
            return null;
    }
}

export default function PatientProgramListPage() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const { data: programs, isLoading, refetch, isRefetching } =
        usePatientPrograms();
    const navigate = useNavigate();

    return (
        <div className="scrollbar-thin flex h-screen flex-col overflow-y-auto bg-background transition-colors duration-200">
            <PatientNavbar />

            <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                        <span className="inline-flex rounded-md border border-primary/10 bg-accent/60 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                            Programas
                        </span>
                        <h1 className="font-serif text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl">
                            Meus programas
                        </h1>
                    </div>

                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0 cursor-pointer"
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        aria-label="Atualizar lista"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
                        <p>Carregando programas. Aguarde...</p>
                    </div>
                ) : !programs || programs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <Activity className="mb-4 h-12 w-12 opacity-20" />
                        <p>
                            Nenhum programa disponível.
                            <br />
                            Entre em contato com o profissional da saúde.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {programs.map((program) => {
                            const totalExercises =
                                program.exerciseCount ??
                                program.groups.reduce(
                                    (acc, g) => acc + g.exercises.length,
                                    0,
                                );
                            const slug =
                                clinicSlug || program.clinicSlug || '';

                            return (
                                <Card
                                    key={program.publicToken}
                                    className="cursor-pointer overflow-hidden transition-all hover:shadow-md"
                                    onClick={() => {
                                        if (!slug) return;
                                        navigate(
                                            patientProgramDetailPath(
                                                slug,
                                                program.publicToken,
                                            ),
                                        );
                                    }}
                                >
                                    <CardContent className="p-4">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <h2 className="font-semibold text-foreground">
                                                {program.name}
                                            </h2>
                                            <PatientProgramStatusBadge
                                                status={program.status}
                                            />
                                        </div>

                                        <div className="mb-3 flex items-center text-sm text-muted-foreground">
                                            <Activity className="mr-1.5 h-4 w-4 text-primary" />
                                            <span>
                                                {totalExercises}{' '}
                                                {totalExercises === 1
                                                    ? 'exercício'
                                                    : 'exercícios'}
                                            </span>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            <p>
                                                Profissional:{' '}
                                                {program.professionalName}
                                            </p>
                                            <p>
                                                Período:{' '}
                                                {program.startDate
                                                    ? new Date(
                                                          program.startDate,
                                                      ).toLocaleDateString(
                                                          'pt-BR',
                                                      )
                                                    : '—'}{' '}
                                                a{' '}
                                                {program.endDate
                                                    ? new Date(
                                                          program.endDate,
                                                      ).toLocaleDateString(
                                                          'pt-BR',
                                                      )
                                                    : '—'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
