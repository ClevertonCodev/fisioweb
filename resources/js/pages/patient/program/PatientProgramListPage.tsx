import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { patientProgramDetailPath } from '@/application/patient/patient-program-paths';
import { usePatientPrograms } from '@/application/patient/use-patient-program';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PatientProgramListPage() {
    const { clinicSlug = '' } = useParams<{ clinicSlug: string }>();
    const { data: programs, isLoading, refetch, isRefetching } =
        usePatientPrograms();
    const navigate = useNavigate();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        Disponível
                    </Badge>
                );
            case 'scheduled':
                return <Badge variant="secondary">Disponível em breve</Badge>;
            case 'unavailable':
                return <Badge variant="destructive">Indisponível</Badge>;
            case 'completed':
                return (
                    <Badge
                        variant="outline"
                        className="border-green-500 text-green-600"
                    >
                        Concluído
                    </Badge>
                );
            case 'inactive':
                return <Badge variant="secondary">Inativo</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen flex-col overflow-y-auto bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground shadow-md">
                <h1 className="text-lg font-semibold">Meus programas</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary-foreground hover:bg-primary/90"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                >
                    <RefreshCw
                        className={`h-5 w-5 ${isRefetching ? 'animate-spin' : ''}`}
                    />
                </Button>
            </header>

            <main className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="mb-4 h-8 w-8 animate-spin" />
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
                                            <h2 className="font-semibold text-slate-900">
                                                {program.name}
                                            </h2>
                                            {getStatusBadge(program.status)}
                                        </div>

                                        <div className="mb-3 flex items-center text-sm text-slate-600">
                                            <Activity className="mr-1.5 h-4 w-4" />
                                            <span>
                                                {totalExercises}{' '}
                                                {totalExercises === 1
                                                    ? 'exercício'
                                                    : 'exercícios'}
                                            </span>
                                        </div>

                                        <div className="text-xs text-slate-500">
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
