import {
    Activity,
    ArrowLeft,
    Calendar,
    ChevronDown,
    ClipboardList,
    Download,
    Edit2,
    FileText,
    LayoutList,
    MoreVertical,
    Paperclip,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    Upload,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
import { usePatient } from '@/application/clinic/use-patients';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { EvolutionFormDrawer } from '@/components/clinic/patient/EvolutionFormDrawer';
import { EvolutionViewDrawer } from '@/components/clinic/patient/EvolutionViewDrawer';
import { PatientAllTab } from '@/components/clinic/patient/PatientAllTab';
import { PatientFileUploadModal } from '@/components/clinic/patient/PatientFileUploadModal';
import { QuestionnaireFormSheet } from '@/components/clinic/patient/QuestionnaireFormSheet';
import { QuestionnaireViewSheet } from '@/components/clinic/patient/QuestionnaireViewSheet';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PatientEvolution, PatientQuestionnaire } from '@/domain/clinic';

// ─── Sub-components ─────────────────────────────────────────────────────────

interface RecordCardProps {
    icon: React.ElementType;
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
    onDelete?: () => void;
}

function RecordCard({
    icon: Icon,
    title,
    date,
    badge,
    badgeVariant = 'neutral',
    children,
    onDelete,
}: RecordCardProps) {
    return (
        <Card className="group transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
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
                    {onDelete && (
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
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2 text-destructive"
                                    onClick={onDelete}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            {children && <CardContent className="pt-0">{children}</CardContent>}
        </Card>
    );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function PatientRecordPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const TAB_MAP: Record<string, string> = {
        questionnaires: 'questionnaire',
        evolutions: 'evolution',
        assessments: 'assessment',
        files: 'files',
        all: 'all',
    };
    const tabFromUrl = searchParams.get('tab');
    const resolvedTab = tabFromUrl
        ? (TAB_MAP[tabFromUrl] ?? tabFromUrl)
        : 'all';
    const [activeTab, setActiveTab] = useState(resolvedTab);
    const [evolutionDrawerOpen, setEvolutionDrawerOpen] = useState(false);
    const [evolutionToEdit, setEvolutionToEdit] = useState<
        PatientEvolution | undefined
    >(undefined);
    const [evolutionDrawerKey, setEvolutionDrawerKey] = useState(0);
    const [evolutionViewOpen, setEvolutionViewOpen] = useState(false);
    const [evolutionToView, setEvolutionToView] = useState<
        PatientEvolution | undefined
    >(undefined);
    const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false);
    const [sendQuestionnaireModalOpen, setSendQuestionnaireModalOpen] =
        useState(false);
    const [evolutionToDelete, setEvolutionToDelete] = useState<
        PatientEvolution | undefined
    >(undefined);
    const [questionnaireViewOpen, setQuestionnaireViewOpen] = useState(false);
    const [questionnaireToView, setQuestionnaireToView] =
        useState<PatientQuestionnaire | null>(null);
    const [questionnaireToDelete, setQuestionnaireToDelete] =
        useState<PatientQuestionnaire | null>(null);

    const openEvolutionDrawer = (evolution?: PatientEvolution) => {
        setEvolutionToEdit(evolution);
        setEvolutionDrawerKey((k) => k + 1);
        setEvolutionDrawerOpen(true);
    };

    const openEvolutionViewDrawer = (evolution: PatientEvolution) => {
        setEvolutionToView(evolution);
        setEvolutionViewOpen(true);
    };

    const handleEditDraftFromView = () => {
        const ev = evolutionToView;
        setEvolutionViewOpen(false);
        setEvolutionToView(undefined);
        if (ev) openEvolutionDrawer(ev);
    };

    const {
        data: patient,
        isLoading: loadingPatient,
        isError: errorPatient,
    } = usePatient(id);

    const {
        data: assessments,
        isLoading: loadingAssessments,
        isError: errorAssessments,
    } = usePatientAssessments(id ?? '');

    const {
        data: evolutions,
        isLoading: loadingEvolutions,
        isError: errorEvolutions,
    } = usePatientEvolutions(id ?? '');

    const { mutate: deleteEvolution } = useDeleteEvolution(id ?? '');
    const { mutate: deleteQuestionnaire } = useDeleteQuestionnaire(id ?? '');

    const {
        data: files,
        isLoading: loadingFiles,
        isError: errorFiles,
    } = usePatientFiles(id ?? '');

    const {
        data: questionnaires,
        isLoading: loadingQuestionnaires,
        isError: errorQuestionnaires,
    } = usePatientQuestionnaires(id ?? '');

    const lowerSearch = searchTerm.trim().toLowerCase();

    const filteredEvolutions = useMemo(() => {
        if (!lowerSearch) return evolutions ?? [];
        return (evolutions ?? []).filter(
            (ev) =>
                ev.title?.toLowerCase().includes(lowerSearch) ||
                ev.generatedText?.toLowerCase().includes(lowerSearch) ||
                ev.notes?.toLowerCase().includes(lowerSearch),
        );
    }, [evolutions, lowerSearch]);

    const filteredAssessments = useMemo(() => {
        if (!lowerSearch) return assessments ?? [];
        return (assessments ?? []).filter((a) =>
            a.template.name.toLowerCase().includes(lowerSearch),
        );
    }, [assessments, lowerSearch]);

    const filteredQuestionnaires = useMemo(() => {
        if (!lowerSearch) return questionnaires ?? [];
        return (questionnaires ?? []).filter((q) =>
            (q.template?.title ?? '').toLowerCase().includes(lowerSearch),
        );
    }, [questionnaires, lowerSearch]);

    const filteredFiles = useMemo(() => {
        if (!lowerSearch) return files ?? [];
        return (files ?? []).filter((f) =>
            f.originalName.toLowerCase().includes(lowerSearch),
        );
    }, [files, lowerSearch]);

    if (errorPatient || (!patient && !loadingPatient)) {
        return (
            <ClinicLayout>
                <div className="flex h-full flex-col items-center justify-center space-y-4 py-16">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <User className="h-7 w-7" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">
                        Paciente não encontrado
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        O paciente que você está tentando acessar não existe ou
                        ocorreu um erro de conexão.
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/clinica/pacientes')}
                        className="mt-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para lista
                    </Button>
                </div>
            </ClinicLayout>
        );
    }

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center gap-4 px-6 py-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        navigate('/clinica/pacientes')
                                    }
                                    className="h-9 w-9 cursor-pointer"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                Voltar
                            </TooltipContent>
                        </Tooltip>
                        <Avatar className="h-10 w-10">
                            {loadingPatient ? (
                                <Skeleton className="h-full w-full rounded-full" />
                            ) : (
                                <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                    {patient?.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-semibold text-foreground">
                                Prontuário
                            </h1>
                            <div className="flex items-center gap-1">
                                {loadingPatient ? (
                                    <Skeleton className="h-4 w-48" />
                                ) : (
                                    <p className="truncate text-sm text-muted-foreground">
                                        {patient?.name}
                                    </p>
                                )}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                navigate(
                                                    `/clinica/pacientes/${id}/editar`,
                                                )
                                            }
                                            className="h-6 w-6 cursor-pointer"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom">
                                        Editar paciente
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button className="cursor-pointer gap-2">
                                    <Plus className="h-4 w-4" />
                                    Adicionar
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${id}/avaliacoes/nova`,
                                        )
                                    }
                                >
                                    <Activity className="h-4 w-4" />
                                    Avaliação
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() => openEvolutionDrawer()}
                                >
                                    <FileText className="h-4 w-4" />
                                    Evolução
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() =>
                                        id &&
                                        setSendQuestionnaireModalOpen(true)
                                    }
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    Questionário
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer gap-2"
                                    onClick={() =>
                                        id && setFileUploadModalOpen(true)
                                    }
                                >
                                    <Upload className="h-4 w-4" />
                                    Adicionar arquivos
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Search bar */}
                <div className="flex flex-wrap items-center gap-3 border-b border-border px-6 py-3">
                    <div className="relative max-w-sm min-w-[200px] flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar registros..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer gap-2"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filtros
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex-1 overflow-auto">
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="flex h-full flex-col"
                    >
                        <div className="px-6 pt-4">
                            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-lg bg-muted/50 p-1">
                                <TabsTrigger
                                    value="all"
                                    className="cursor-pointer gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <LayoutList className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Todos
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="evolution"
                                    className="cursor-pointer gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <FileText className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Evoluções
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="assessment"
                                    className="cursor-pointer gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <Activity className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Avaliações
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="questionnaire"
                                    className="cursor-pointer gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Questionários
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="files"
                                    className="cursor-pointer gap-2 rounded-md px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                >
                                    <Paperclip className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        Arquivos
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-1 px-1.5 py-0 text-[10px]"
                                    >
                                        {files?.length || 0}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Todos */}
                        <TabsContent value="all" className="flex-1 px-6 py-4">
                            <div className="max-w-3xl">
                                <PatientAllTab
                                    patientId={id ?? ''}
                                    searchTerm={searchTerm}
                                    onViewEvolution={openEvolutionViewDrawer}
                                    onEditEvolution={openEvolutionDrawer}
                                />
                            </div>
                        </TabsContent>

                        {/* Evoluções */}
                        <TabsContent
                            value="evolution"
                            className="flex-1 px-6 py-4"
                        >
                            <div className="max-w-3xl space-y-4">
                                {loadingEvolutions && (
                                    <>
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                    </>
                                )}
                                {errorEvolutions && (
                                    <p className="text-sm text-destructive">
                                        Erro ao carregar evoluções.
                                    </p>
                                )}
                                {!loadingEvolutions &&
                                    filteredEvolutions.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Nenhuma evolução registrada.
                                        </p>
                                    )}
                                {filteredEvolutions.map((ev) => (
                                    <RecordCard
                                        key={ev.id}
                                        icon={FileText}
                                        title={
                                            ev.title || 'Sessão de Fisioterapia'
                                        }
                                        date={new Date(
                                            ev.createdAt,
                                        ).toLocaleDateString('pt-BR')}
                                        badge={
                                            ev.status === 'signed'
                                                ? 'Assinada'
                                                : 'Rascunho'
                                        }
                                        badgeVariant={
                                            ev.status === 'signed'
                                                ? 'active'
                                                : 'neutral'
                                        }
                                    >
                                        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                                            {ev.generatedText ||
                                                ev.notes ||
                                                'Sem texto preenchido.'}
                                        </p>
                                        {ev.clinicUser && (
                                            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                <Avatar className="h-5 w-5">
                                                    <AvatarFallback className="bg-muted text-[9px]">
                                                        {ev.clinicUser.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>
                                                    Criado por{' '}
                                                    <span className="font-medium text-foreground">
                                                        {ev.clinicUser.name}
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer gap-1.5"
                                                onClick={() =>
                                                    ev.status === 'signed'
                                                        ? openEvolutionViewDrawer(
                                                              ev,
                                                          )
                                                        : openEvolutionDrawer(
                                                              ev,
                                                          )
                                                }
                                            >
                                                {ev.status === 'signed' ? (
                                                    <FileText className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                )}
                                                {ev.status === 'signed'
                                                    ? 'Ver evolução'
                                                    : 'Editar rascunho'}
                                            </Button>
                                            {ev.status === 'draft' ? (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer gap-1.5"
                                                        onClick={() =>
                                                            openEvolutionViewDrawer(
                                                                ev,
                                                            )
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
                                                            setEvolutionToDelete(
                                                                ev,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Excluir rascunho
                                                    </Button>
                                                </>
                                            ) : null}
                                        </div>
                                    </RecordCard>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Avaliações */}
                        <TabsContent
                            value="assessment"
                            className="flex-1 px-6 py-4"
                        >
                            <div className="max-w-3xl space-y-4">
                                {loadingAssessments && (
                                    <>
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                    </>
                                )}
                                {errorAssessments && (
                                    <p className="text-sm text-destructive">
                                        Erro ao carregar avaliações.
                                    </p>
                                )}
                                {!loadingAssessments &&
                                    filteredAssessments.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Nenhuma avaliação registrada.
                                        </p>
                                    )}
                                {filteredAssessments.map((a) => (
                                    <RecordCard
                                        key={a.id}
                                        icon={Activity}
                                        title={a.template.name}
                                        date={
                                            a.signedAt
                                                ? new Date(
                                                      a.signedAt,
                                                  ).toLocaleDateString('pt-BR')
                                                : '—'
                                        }
                                        badge={
                                            a.status === 'signed'
                                                ? 'Assinada'
                                                : 'Rascunho'
                                        }
                                        badgeVariant={
                                            a.status === 'signed'
                                                ? 'active'
                                                : 'neutral'
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
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="cursor-pointer gap-1.5"
                                                onClick={() =>
                                                    navigate(
                                                        `/clinica/pacientes/${id}/avaliacoes/${a.id}/editar`,
                                                    )
                                                }
                                            >
                                                <Edit2 className="h-3.5 w-3.5" />
                                                {a.status === 'draft'
                                                    ? 'Editar rascunho'
                                                    : 'Ver avaliação'}
                                            </Button>
                                        </div>
                                    </RecordCard>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Questionários */}
                        <TabsContent
                            value="questionnaire"
                            className="flex-1 px-6 py-4"
                        >
                            <div className="max-w-3xl space-y-4">
                                {loadingQuestionnaires && (
                                    <>
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                        <Skeleton className="h-32 w-full rounded-xl" />
                                    </>
                                )}
                                {errorQuestionnaires && (
                                    <p className="text-sm text-destructive">
                                        Erro ao carregar questionários.
                                    </p>
                                )}
                                {!loadingQuestionnaires &&
                                    filteredQuestionnaires.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Nenhum questionário registrado.
                                        </p>
                                    )}
                                {filteredQuestionnaires.map((q) => {
                                    const templateTitle =
                                        q.template?.title ?? null;
                                    const returnTo = encodeURIComponent(
                                        `/clinica/pacientes/${id}?tab=questionnaires`,
                                    );
                                    return (
                                        <RecordCard
                                            key={q.id}
                                            icon={ClipboardList}
                                            title={
                                                templateTitle ??
                                                '[Template excluído]'
                                            }
                                            date={new Date(
                                                q.createdAt,
                                            ).toLocaleDateString('pt-BR')}
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
                                            onDelete={
                                                q.status !== 'answered'
                                                    ? () =>
                                                          setQuestionnaireToDelete(
                                                              q,
                                                          )
                                                    : undefined
                                            }
                                        >
                                            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                {q.clinicUser && (
                                                    <>
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarFallback className="bg-muted text-[9px]">
                                                                {
                                                                    q.clinicUser
                                                                        .name[0]
                                                                }
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>
                                                            Por{' '}
                                                            <span className="font-medium text-foreground">
                                                                {
                                                                    q.clinicUser
                                                                        .name
                                                                }
                                                            </span>
                                                        </span>
                                                        <span className="mx-1">
                                                            •
                                                        </span>
                                                    </>
                                                )}
                                                <span>
                                                    Modalidade: {q.modality}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer"
                                                    onClick={() => {
                                                        setQuestionnaireToView(
                                                            q,
                                                        );
                                                        setQuestionnaireViewOpen(
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    Ver questionário
                                                </Button>
                                                {templateTitle && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="cursor-pointer gap-1.5"
                                                        onClick={() =>
                                                            navigate(
                                                                `/clinica/questionarios/${q.questionnaireTemplateId}/editar?returnTo=${returnTo}`,
                                                            )
                                                        }
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                        Editar
                                                    </Button>
                                                )}
                                            </div>
                                        </RecordCard>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        {/* Arquivos */}
                        <TabsContent value="files" className="flex-1 px-6 py-4">
                            <div className="max-w-3xl space-y-4">
                                {loadingFiles && (
                                    <>
                                        <Skeleton className="h-20 w-full rounded-xl" />
                                        <Skeleton className="h-20 w-full rounded-xl" />
                                    </>
                                )}
                                {errorFiles && (
                                    <p className="text-sm text-destructive">
                                        Erro ao carregar arquivos.
                                    </p>
                                )}
                                {!loadingFiles &&
                                    filteredFiles.length === 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            Nenhum arquivo registrado.
                                        </p>
                                    )}
                                {filteredFiles.map((file) => (
                                    <Card
                                        key={file.id}
                                        className="group transition-shadow hover:shadow-md"
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 text-primary">
                                                    {file.mimeType?.startsWith(
                                                        'image/',
                                                    ) ? (
                                                        <img
                                                            src={file.cdnUrl}
                                                            alt={
                                                                file.name ??
                                                                file.originalName
                                                            }
                                                            className="h-10 w-10 object-cover"
                                                        />
                                                    ) : (
                                                        <FileText className="h-5 w-5" />
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-semibold text-foreground">
                                                        {file.name ??
                                                            file.originalName}
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>
                                                            {(
                                                                file.size / 1024
                                                            ).toFixed(1)}{' '}
                                                            kb
                                                        </span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(
                                                                file.createdAt,
                                                            ).toLocaleDateString(
                                                                'pt-BR',
                                                            )}
                                                        </span>
                                                    </div>
                                                    {file.clinicUser && (
                                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <User className="h-3 w-3" />
                                                            <span>
                                                                {
                                                                    file
                                                                        .clinicUser
                                                                        .name
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            className="cursor-pointer gap-2"
                                                            onClick={() =>
                                                                window.open(
                                                                    file.cdnUrl,
                                                                    '_blank',
                                                                )
                                                            }
                                                        >
                                                            <Download className="h-4 w-4" />
                                                            Download
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <EvolutionFormDrawer
                key={evolutionDrawerKey}
                open={evolutionDrawerOpen}
                onOpenChange={setEvolutionDrawerOpen}
                patientId={id ?? ''}
                evolutionToEdit={evolutionToEdit}
            />
            <EvolutionViewDrawer
                open={evolutionViewOpen}
                onOpenChange={(open) => {
                    setEvolutionViewOpen(open);
                    if (!open) setEvolutionToView(undefined);
                }}
                patientName={patient?.name ?? ''}
                evolution={evolutionToView ?? null}
                onEditDraft={handleEditDraftFromView}
            />
            <QuestionnaireViewSheet
                open={questionnaireViewOpen}
                onOpenChange={(open) => {
                    setQuestionnaireViewOpen(open);
                    if (!open) setQuestionnaireToView(null);
                }}
                patientId={id ?? ''}
                questionnaire={questionnaireToView}
            />

            {id ? (
                <>
                    <PatientFileUploadModal
                        open={fileUploadModalOpen}
                        onOpenChange={setFileUploadModalOpen}
                        patientId={id}
                    />
                    <QuestionnaireFormSheet
                        open={sendQuestionnaireModalOpen}
                        onOpenChange={setSendQuestionnaireModalOpen}
                        patientId={id}
                        patientRecordPath={`/clinica/pacientes/${id}`}
                    />
                </>
            ) : null}

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

            <AlertDialog
                open={!!evolutionToDelete}
                onOpenChange={(open) =>
                    !open && setEvolutionToDelete(undefined)
                }
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
                                if (evolutionToDelete)
                                    deleteEvolution(
                                        String(evolutionToDelete.id),
                                    );
                                setEvolutionToDelete(undefined);
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ClinicLayout>
    );
}
