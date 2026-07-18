import {
    BookmarkCheck,
    CalendarDays,
    Copy,
    Dumbbell,
    FileDown,
    FileText,
    MoreVertical,
    Pencil,
    Trash2,
    User,
} from 'lucide-react';
import { useState } from 'react';
import { useLoaderData, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { downloadProgramPdf } from '@/application/clinic/download-program-pdf';
import { formatProgramClinicalRecordText } from '@/application/clinic/format-program-clinical-record-text';
import {
    useClinicProgram,
    useConvertToModelClinicProgram,
    useDeleteClinicProgram,
    useDuplicateClinicProgram,
} from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VideoThumb } from '@/components/VideoThumb';
import type { Program, ProgramExercise } from '@/domain/clinic';

export type ClinicProgramDetailLoaderData = {
    program: Program | null;
    error: string | null;
};

type UiStatus = 'not_viewed' | 'viewed' | 'completed' | 'draft';

function deriveUiStatus(program: Program): UiStatus {
    if (program.status === 'draft') return 'draft';
    if (program.status === 'completed') return 'completed';
    if (program.patientViewedAt) return 'viewed';
    return 'not_viewed';
}

function StatusBadge({ program }: { program: Program }) {
    const ui = deriveUiStatus(program);
    if (ui === 'completed') {
        return (
            <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-600"
            >
                Completou
                {program.patientCompletedCount > 0
                    ? ` • ${program.patientCompletedCount}x`
                    : ''}
            </Badge>
        );
    }
    if (ui === 'not_viewed') {
        return (
            <Badge
                variant="outline"
                className="border-amber-200 bg-amber-50 text-amber-600"
            >
                Não visualizado
            </Badge>
        );
    }
    if (ui === 'viewed') {
        return (
            <Badge
                variant="outline"
                className="border-border text-muted-foreground"
            >
                Visualizado
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="border-border text-muted-foreground"
        >
            Rascunho
        </Badge>
    );
}

const periodLabels: Record<string, string> = {
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
};

function formatFrequency(exercise: ProgramExercise): string {
    const parts: string[] = [];

    if (exercise.days && exercise.days.length > 0) {
        parts.push(
            exercise.days.length === 7
                ? 'Todos os dias'
                : `${exercise.days.length}x/semana`,
        );
    }

    if (exercise.period) {
        parts.push(periodLabels[exercise.period] ?? exercise.period);
    }

    const sMin = exercise.seriesMin;
    const sMax = exercise.seriesMax;
    if (sMin != null || sMax != null) {
        const val =
            sMin != null && sMax != null && sMin !== sMax
                ? `${sMin}-${sMax}`
                : String(sMin ?? sMax);
        parts.push(`${val} séries`);
    }

    const rMin = exercise.repetitionsMin;
    const rMax = exercise.repetitionsMax;
    if (rMin != null || rMax != null) {
        const val =
            rMin != null && rMax != null && rMin !== rMax
                ? `${rMin}-${rMax}`
                : String(rMin ?? rMax);
        parts.push(`${val} repetições`);
    }

    if (exercise.restTime != null) {
        parts.push(`descansar por ${exercise.restTime}s`);
    }

    return parts.length > 0 ? parts.join(', ') : 'Sem configuração';
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function daysUntil(iso: string | null): number | null {
    if (!iso) return null;
    const normalized = iso.includes('T') ? iso : iso + 'T00:00:00';
    const end = new Date(normalized);
    if (isNaN(end.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - now.getTime()) / 86_400_000);
}

function ExerciseRow({ exercise }: { exercise: ProgramExercise }) {
    return (
        <div className="flex items-center gap-5 rounded-lg border border-border bg-card p-4">
            <div className="group relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <VideoThumb
                    videoUrl={exercise.videoUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                />
            </div>

            <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium text-foreground">
                    {exercise.title}
                </span>
                <span className="text-sm text-muted-foreground">
                    {formatFrequency(exercise)}
                </span>
            </div>
        </div>
    );
}

export default function ProgramDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { program: loaderProgram, error: loaderError } =
        useLoaderData() as ClinicProgramDetailLoaderData;
    const { data: program = loaderProgram } = useClinicProgram(id);
    const { mutate: duplicate } = useDuplicateClinicProgram();
    const { mutate: toModel } = useConvertToModelClinicProgram();
    const { mutate: deleteProgram } = useDeleteClinicProgram();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    if (loaderError) {
        return (
            <ClinicLayout>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-muted-foreground">{loaderError}</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => navigate('/clinica/programas')}
                    >
                        Voltar
                    </Button>
                </div>
            </ClinicLayout>
        );
    }

    if (!program) {
        return (
            <ClinicLayout>
                <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">
                        Programa não encontrado.
                    </p>
                </div>
            </ClinicLayout>
        );
    }

    const validityDays = daysUntil(program.endDate);

    const copyClinicalText = async () => {
        try {
            const text = formatProgramClinicalRecordText(program);
            if (!text) {
                toast.error('Programa sem exercícios para copiar.');
                return;
            }
            await navigator.clipboard.writeText(text);
            toast.success('Texto copiado para a área de transferência.');
        } catch {
            toast.error('Não foi possível copiar o texto.');
        }
    };

    return (
        <>
            <ClinicLayout>
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                        <div className="flex items-center justify-between gap-4 px-6 py-4">
                            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
                                Detalhes do programa
                            </h1>
                            <BackButton
                                to="/clinica/programas"
                                className="shrink-0"
                            />
                        </div>
                    </header>

                    {/* Content */}
                    <div className="flex-1 space-y-8 overflow-auto p-6">
                        {/* Program Info Card */}
                        <Card className="p-6">
                            <div className="mb-1 flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-semibold text-foreground">
                                        {program.title}
                                    </h2>
                                    <StatusBadge program={program} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    navigate(
                                                        `/clinica/programas/${program.id}/editar`,
                                                    )
                                                }
                                                className="cursor-pointer gap-2"
                                            >
                                                <Pencil className="h-4 w-4" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    duplicate(program.id)
                                                }
                                                className="cursor-pointer gap-2"
                                            >
                                                <Copy className="h-4 w-4" />
                                                Duplicar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={copyClinicalText}
                                                className="cursor-pointer gap-2"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Texto para prontuário
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    downloadProgramPdf(
                                                        program.id,
                                                    )
                                                }
                                                className="cursor-pointer gap-2"
                                            >
                                                <FileDown className="h-4 w-4" />
                                                Baixar PDF
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    toModel(program.id)
                                                }
                                                className="cursor-pointer gap-2"
                                            >
                                                <BookmarkCheck className="h-4 w-4" />
                                                Transformar em modelo
                                            </DropdownMenuItem>
                                            {program.status === 'draft' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        setShowDeleteDialog(
                                                            true,
                                                        )
                                                    }
                                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {program.professionalName && (
                                <p className="mb-1 text-sm text-muted-foreground">
                                    Criado por: {program.professionalName}
                                </p>
                            )}
                            <p className="mb-5 text-sm text-muted-foreground">
                                Data de criação: {formatDate(program.createdAt)}
                            </p>

                            {/* Info Row */}
                            <div className="flex flex-wrap items-center gap-8">
                                {program.patientName && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Paciente:
                                            </p>
                                            <p className="text-sm font-medium text-foreground">
                                                {program.patientName}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Exercícios:
                                        </p>
                                        <p className="text-sm font-medium text-foreground">
                                            {program.exerciseCount}{' '}
                                            {program.exerciseCount === 1
                                                ? 'exercício'
                                                : 'exercícios'}
                                        </p>
                                    </div>
                                </div>

                                {program.endDate && (
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Válido até:
                                            </p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDate(program.endDate)}{' '}
                                                {validityDays != null && (
                                                    <span className="text-primary">
                                                        ({validityDays} dias)
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Groups */}
                        {program.groups.map((group) => (
                            <div key={group.id}>
                                <div className="mb-4 flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-foreground">
                                        {group.name}
                                    </h2>
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {group.exercises.length}
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {group.exercises.map((exercise) => (
                                        <ExerciseRow
                                            key={exercise.id}
                                            exercise={exercise}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </ClinicLayout>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir programa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir{' '}
                            <strong>"{program.title}"</strong>? Esta ação não
                            pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                deleteProgram(program.id, {
                                    onSuccess: () =>
                                        navigate('/clinica/programas'),
                                });
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
