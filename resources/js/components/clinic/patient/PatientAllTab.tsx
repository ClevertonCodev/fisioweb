import {
    Activity,
    Calendar,
    ClipboardList,
    Download,
    Edit2,
    FileText,
    Image as ImageIcon,
    MoreVertical,
    Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePatientAssessments } from '@/application/clinic/use-assessments';
import {
    useDeleteEvolution,
    usePatientEvolutions,
} from '@/application/clinic/use-evolutions';
import { usePatientFiles } from '@/application/clinic/use-patient-files';
import {
    useDeleteQuestionnaire,
    usePatientQuestionnaires,
} from '@/application/clinic/use-patient-questionnaires';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import type {
    AssessmentSummary,
    PatientEvolution,
    PatientFile,
    PatientQuestionnaire,
} from '@/domain/clinic';

interface PatientAllTabProps {
    patientId: string;
    searchTerm?: string;
    /** Visualização somente texto (sem checklist). */
    onViewEvolution?: (evolution: PatientEvolution) => void;
    onEditEvolution?: (evolution: PatientEvolution) => void;
    onDeleteEvolution?: (evolution: PatientEvolution) => void;
}

type TimelineEntry =
    | { id: string; type: 'assessment'; date: Date; data: AssessmentSummary }
    | { id: string; type: 'evolution'; date: Date; data: PatientEvolution }
    | { id: string; type: 'file'; date: Date; data: PatientFile }
    | {
          id: string;
          type: 'questionnaire';
          date: Date;
          data: PatientQuestionnaire;
      };

// ─── Helper Component para Cards da Timeline ────────────────────────────────
interface RecordCardProps {
    icon: React.ElementType;
    iconUrl?: string;
    title: string;
    date: string;
    badge?: string;
    badgeVariant?:
        | 'active'
        | 'warning'
        | 'danger'
        | 'neutral'
        | 'success'
        | 'info';
    children?: React.ReactNode;
    actions?: React.ReactNode;
}

function TimelineCard({
    icon: Icon,
    iconUrl,
    title,
    date,
    badge,
    badgeVariant = 'neutral',
    children,
    actions,
}: RecordCardProps) {
    return (
        <Card className="group relative transition-shadow hover:shadow-md">
            {/* O bolinha da timeline (opcional, posicionado via CSS se usar uma linha vertical) */}
            <div className="absolute top-6 -left-[35px] hidden h-3 w-3 rounded-full border-2 border-primary bg-background sm:block" />

            <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                        {iconUrl ? (
                            <img
                                src={iconUrl}
                                alt={title}
                                className="h-10 w-10 object-cover"
                            />
                        ) : (
                            <Icon className="h-5 w-5" />
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                {title}
                            </h3>
                            {badge && (
                                <StatusBadge variant={badgeVariant}>
                                    {badge}
                                </StatusBadge>
                            )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{date}</span>
                        </div>
                    </div>
                    {actions && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {actions}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            {children && <CardContent className="pt-0">{children}</CardContent>}
        </Card>
    );
}

export function PatientAllTab({
    patientId,
    searchTerm,
    onViewEvolution,
    onEditEvolution,
    onDeleteEvolution,
}: PatientAllTabProps) {
    const navigate = useNavigate();
    const [evolutionToDelete, setEvolutionToDelete] =
        useState<PatientEvolution | null>(null);
    const [questionnaireToDelete, setQuestionnaireToDelete] =
        useState<PatientQuestionnaire | null>(null);

    // ─── Fetching (Paralelo) ──────────────────────────────────────────────────
    const { data: assessments, isLoading: loadA } =
        usePatientAssessments(patientId);
    const { data: evolutions, isLoading: loadE } =
        usePatientEvolutions(patientId);
    const { mutate: deleteEvolution } = useDeleteEvolution(patientId);
    const { data: files, isLoading: loadF } = usePatientFiles(patientId);
    const { data: questionnaires, isLoading: loadQ } =
        usePatientQuestionnaires(patientId);
    const { mutate: deleteQuestionnaire } = useDeleteQuestionnaire(patientId);

    const isLoading = loadA || loadE || loadF || loadQ;

    // ─── Normalização e Ordenação ─────────────────────────────────────────────
    const timeline = useMemo(() => {
        const entries: TimelineEntry[] = [];

        if (assessments) {
            assessments.forEach((a) => {
                entries.push({
                    id: `assessment-${a.id}`,
                    type: 'assessment',
                    date: a.signedAt ? new Date(a.signedAt) : new Date(), // TODO: add createdAt to assessment summary later if needed
                    data: a,
                });
            });
        }

        if (evolutions) {
            evolutions.forEach((e) => {
                entries.push({
                    id: `evolution-${e.id}`,
                    type: 'evolution',
                    date: new Date(e.createdAt),
                    data: e,
                });
            });
        }

        if (files) {
            files.forEach((f) => {
                entries.push({
                    id: `file-${f.id}`,
                    type: 'file',
                    date: new Date(f.createdAt),
                    data: f,
                });
            });
        }

        if (questionnaires) {
            questionnaires.forEach((q) => {
                entries.push({
                    id: `questionnaire-${q.id}`,
                    type: 'questionnaire',
                    date: new Date(q.createdAt),
                    data: q,
                });
            });
        }

        // Ordem cronológica decrescente
        return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [assessments, evolutions, files, questionnaires]);

    const filteredTimeline = useMemo(() => {
        const term = searchTerm?.trim().toLowerCase();
        if (!term) return timeline;
        return timeline.filter((entry) => {
            if (entry.type === 'evolution') {
                const e = entry.data;
                return (
                    e.title?.toLowerCase().includes(term) ||
                    e.generatedText?.toLowerCase().includes(term) ||
                    e.notes?.toLowerCase().includes(term)
                );
            }
            if (entry.type === 'assessment')
                return entry.data.template.name.toLowerCase().includes(term);
            if (entry.type === 'questionnaire')
                return (entry.data.template?.title ?? '')
                    .toLowerCase()
                    .includes(term);
            if (entry.type === 'file')
                return entry.data.originalName.toLowerCase().includes(term);
            return true;
        });
    }, [timeline, searchTerm]);

    // ─── Render ───────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        );
    }

    if (filteredTimeline.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                    <ClipboardList className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">
                    Nenhum registro encontrado
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Crie uma evolução, avaliação, ou adicione arquivos para
                    popular a timeline.
                </p>
            </div>
        );
    }

    return (
        <div className="relative pl-0 sm:pl-8">
            {/* Linha vertical da timeline (escondida no mobile) */}
            <div className="absolute top-6 bottom-0 left-[11px] hidden w-0.5 bg-border sm:block" />

            <div className="space-y-4">
                {filteredTimeline.map((entry) => {
                    const dateStr = entry.date.toLocaleDateString('pt-BR');

                    // 1. AVALIAÇÃO
                    if (entry.type === 'assessment') {
                        const a = entry.data;
                        return (
                            <TimelineCard
                                key={entry.id}
                                icon={Activity}
                                title={a.template.name}
                                date={dateStr}
                                badge={
                                    a.status === 'signed'
                                        ? 'Assinada'
                                        : 'Rascunho'
                                }
                                badgeVariant={
                                    a.status === 'signed' ? 'active' : 'neutral'
                                }
                                actions={
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2"
                                        onClick={() =>
                                            navigate(
                                                `/clinica/pacientes/${patientId}/avaliacoes/${a.id}/editar`,
                                            )
                                        }
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        {a.status === 'draft'
                                            ? 'Editar rascunho'
                                            : 'Ver avaliação'}
                                    </DropdownMenuItem>
                                }
                            >
                                {a.clinicUser && (
                                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Avatar className="h-5 w-5">
                                            <AvatarFallback className="bg-muted text-[9px]">
                                                {a.clinicUser.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>
                                            Por{' '}
                                            <span className="font-medium text-foreground">
                                                {a.clinicUser.name}
                                            </span>
                                        </span>
                                    </div>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${patientId}/avaliacoes/${a.id}/editar`,
                                        )
                                    }
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                    {a.status === 'draft'
                                        ? 'Editar'
                                        : 'Ver avaliação'}
                                </Button>
                            </TimelineCard>
                        );
                    }

                    // 2. EVOLUÇÃO
                    if (entry.type === 'evolution') {
                        const e = entry.data;
                        return (
                            <TimelineCard
                                key={entry.id}
                                icon={FileText}
                                title={e.title || 'Sessão de Fisioterapia'}
                                date={dateStr}
                                badge={
                                    e.status === 'signed'
                                        ? 'Assinada'
                                        : 'Rascunho'
                                }
                                badgeVariant={
                                    e.status === 'signed' ? 'active' : 'neutral'
                                }
                                actions={
                                    <>
                                        <DropdownMenuItem
                                            className="cursor-pointer gap-2"
                                            onClick={() => onViewEvolution?.(e)}
                                        >
                                            <FileText className="h-4 w-4" />
                                            {e.status === 'signed'
                                                ? 'Ver evolução'
                                                : 'Visualizar texto'}
                                        </DropdownMenuItem>
                                        {e.status === 'draft' ? (
                                            <>
                                                <DropdownMenuItem
                                                    className="cursor-pointer gap-2"
                                                    onClick={() =>
                                                        onEditEvolution?.(e)
                                                    }
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                    Editar rascunho
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                                    onClick={() =>
                                                        setEvolutionToDelete(e)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir rascunho
                                                </DropdownMenuItem>
                                            </>
                                        ) : null}
                                    </>
                                }
                            >
                                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                    {e.generatedText ||
                                        e.notes ||
                                        'Sem texto preenchido.'}
                                </p>
                                {e.clinicUser && (
                                    <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                        <Avatar className="h-5 w-5">
                                            <AvatarFallback className="bg-muted text-[9px]">
                                                {e.clinicUser.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>
                                            Criado por{' '}
                                            <span className="font-medium text-foreground">
                                                {e.clinicUser.name}
                                            </span>
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="cursor-pointer gap-1.5"
                                        onClick={() =>
                                            e.status === 'signed'
                                                ? onViewEvolution?.(e)
                                                : onEditEvolution?.(e)
                                        }
                                    >
                                        <FileText className="h-3.5 w-3.5" />
                                        {e.status === 'signed'
                                            ? 'Ver evolução'
                                            : 'Editar rascunho'}
                                    </Button>
                                    {e.status === 'draft' && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer gap-1.5"
                                                onClick={() =>
                                                    onViewEvolution?.(e)
                                                }
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                Visualizar texto
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer gap-1.5 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    setEvolutionToDelete(e)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Excluir rascunho
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TimelineCard>
                        );
                    }

                    // 3. ARQUIVO
                    if (entry.type === 'file') {
                        const f = entry.data;
                        const isImage = f.mimeType?.startsWith('image/');
                        return (
                            <TimelineCard
                                key={entry.id}
                                icon={isImage ? ImageIcon : FileText}
                                iconUrl={isImage ? f.cdnUrl : undefined}
                                title={f.name ?? f.originalName}
                                date={dateStr}
                                actions={
                                    <DropdownMenuItem
                                        className="cursor-pointer gap-2"
                                        onClick={() =>
                                            window.open(f.cdnUrl, '_blank')
                                        }
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </DropdownMenuItem>
                                }
                            >
                                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{(f.size / 1024).toFixed(1)} kb</span>
                                    <span>•</span>
                                    <span>
                                        Upload via{' '}
                                        {f.clinicUser?.name || 'Sistema'}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5"
                                    onClick={() =>
                                        window.open(f.cdnUrl, '_blank')
                                    }
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download arquivo
                                </Button>
                            </TimelineCard>
                        );
                    }

                    // 4. QUESTIONÁRIO
                    if (entry.type === 'questionnaire') {
                        const q = entry.data;
                        const templateTitle = q.template?.title ?? null;
                        const returnTo = encodeURIComponent(
                            `/clinica/pacientes/${patientId}?tab=questionnaires`,
                        );
                        return (
                            <TimelineCard
                                key={entry.id}
                                icon={ClipboardList}
                                title={templateTitle ?? '[Template excluído]'}
                                date={dateStr}
                                badge={
                                    q.status === 'answered'
                                        ? 'Respondido'
                                        : q.status === 'expired'
                                          ? 'Expirado'
                                          : 'Pendente'
                                }
                                badgeVariant={
                                    q.status === 'answered'
                                        ? 'active'
                                        : q.status === 'expired'
                                          ? 'danger'
                                          : 'neutral'
                                }
                                actions={
                                    <>
                                        {templateTitle && (
                                            <DropdownMenuItem
                                                className="cursor-pointer gap-2"
                                                onClick={() =>
                                                    navigate(
                                                        `/clinica/questionarios/${q.questionnaireTemplateId}/editar?returnTo=${returnTo}`,
                                                    )
                                                }
                                            >
                                                <Edit2 className="h-4 w-4" />
                                                Editar template
                                            </DropdownMenuItem>
                                        )}
                                        {q.status !== 'answered' && (
                                            <DropdownMenuItem
                                                className="cursor-pointer gap-2 text-destructive"
                                                onClick={() =>
                                                    setQuestionnaireToDelete(q)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Excluir
                                            </DropdownMenuItem>
                                        )}
                                    </>
                                }
                            >
                                <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>Modalidade: {q.modality}</span>
                                    <span>•</span>
                                    <span>
                                        Enviado por{' '}
                                        {q.clinicUser?.name || 'Sistema'}
                                    </span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer gap-1.5"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${patientId}?tab=questionnaires`,
                                        )
                                    }
                                >
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    Ver questionário
                                </Button>
                            </TimelineCard>
                        );
                    }

                    return null;
                })}
            </div>

            <AlertDialog
                open={!!evolutionToDelete}
                onOpenChange={(open) => !open && setEvolutionToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir rascunho</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir{' '}
                            <strong>
                                "
                                {evolutionToDelete?.title ||
                                    'Sessão de Fisioterapia'}
                                "
                            </strong>
                            ? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (evolutionToDelete) {
                                    onDeleteEvolution
                                        ? onDeleteEvolution(evolutionToDelete)
                                        : deleteEvolution(
                                              String(evolutionToDelete.id),
                                          );
                                }
                                setEvolutionToDelete(null);
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={!!questionnaireToDelete}
                onOpenChange={(open) => !open && setQuestionnaireToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir questionário
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este questionário do
                            paciente? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (questionnaireToDelete)
                                    deleteQuestionnaire(
                                        String(questionnaireToDelete.id),
                                    );
                                setQuestionnaireToDelete(null);
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
