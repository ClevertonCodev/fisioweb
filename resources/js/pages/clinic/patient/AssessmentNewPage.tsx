import {
    AlertCircle,
    ChevronLeft,
    ClipboardList,
    FileText,
    Link as LinkIcon,
    Plus,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
    useAssessmentTemplate,
    useAssessmentTemplates,
    useCreateAssessment,
} from '@/application/clinic/use-assessments';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { AssessmentField, AssessmentSection } from '@/domain/clinic';
import { cn } from '@/lib/utils';

function FieldPreview({ field }: { field: AssessmentField }) {
    if (field.fieldType === 'textarea') {
        return (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground italic">
                Escreva sua resposta aqui
            </div>
        );
    }
    if (field.fieldType === 'text') {
        return (
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground italic">
                Resposta curta
            </div>
        );
    }
    if (field.fieldType === 'number') {
        const unit = field.config?.unit;
        return (
            <div className="flex w-full max-w-xs items-center gap-2">
                <div className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-right text-sm text-muted-foreground">
                    —
                </div>
                {unit && (
                    <span className="shrink-0 text-sm text-muted-foreground">
                        {unit}
                    </span>
                )}
            </div>
        );
    }
    if (field.fieldType === 'range') {
        const min = field.config?.min ?? 0;
        const max = field.config?.max ?? 10;
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="hidden w-20 shrink-0 text-right text-xs text-muted-foreground sm:block">
                        {field.config?.minLabel ?? min}
                    </span>
                    <div className="h-2 min-w-0 flex-1 rounded-full bg-border" />
                    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-primary bg-background shadow" />
                    <span className="hidden w-20 shrink-0 text-xs text-muted-foreground sm:block">
                        {field.config?.maxLabel ?? max}
                    </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground sm:hidden">
                    <span>{field.config?.minLabel ?? min}</span>
                    <span>{field.config?.maxLabel ?? max}</span>
                </div>
            </div>
        );
    }
    if (field.fieldType === 'checkbox' && field.options.length > 0) {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {field.options.map((opt, i) => (
                    <div
                        key={opt.id}
                        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <span className="shrink-0 text-xs font-bold text-muted-foreground">
                            {letters[i]}.
                        </span>
                        <span className="min-w-0 flex-1 text-xs break-words">
                            {opt.label}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function SectionPreview({ section }: { section: AssessmentSection }) {
    return (
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="bg-muted px-4 py-3 sm:px-5">
                <h3 className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase sm:text-xs">
                    {section.title}
                </h3>
            </div>
            <div className="space-y-5 p-4 sm:p-5">
                {section.fields.map((field) => (
                    <div key={field.id}>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                            {field.label}
                            {field.required && (
                                <span className="ml-1 text-destructive">*</span>
                            )}
                        </label>
                        <FieldPreview field={field} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AssessmentNewPage() {
    const { id: patientId } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'vedius' | 'custom'>('vedius');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const {
        data: templates,
        isLoading: loadingTemplates,
        isError: errorTemplates,
    } = useAssessmentTemplates(search);

    const { data: selectedTemplate, isLoading: loadingTemplate } =
        useAssessmentTemplate(selectedId);

    const createAssessment = useCreateAssessment(patientId!);

    function handleRespond() {
        if (!selectedId) return;
        createAssessment.mutate(
            { templateId: Number(selectedId), answers: [], answerOptions: [] },
            {
                onSuccess: (assessment) => {
                    navigate(
                        `/clinica/pacientes/${patientId}/avaliacoes/${assessment.id}/editar`,
                    );
                },
            },
        );
    }

    const selectedTemplateName =
        selectedTemplate?.name ??
        templates?.find((t) => String(t.id) === selectedId)?.name;

    const showListOnMobile = !selectedId;
    const showPreviewOnMobile = Boolean(selectedId);

    return (
        <ClinicLayout>
            <div className="flex h-[calc(100vh-64px)] overflow-hidden">
                {/* ── Left panel (list) ───────────────────── */}
                <aside
                    className={cn(
                        'flex w-full shrink-0 flex-col border-border bg-card md:w-80 md:border-r',
                        showListOnMobile ? 'flex' : 'hidden',
                        'md:flex',
                    )}
                >
                    {/* Back + title */}
                    <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-2">
                        <h2 className="text-xl font-semibold text-foreground">
                            Avaliações
                        </h2>
                        <BackButton
                            to={`/clinica/pacientes/${patientId}`}
                            className="shrink-0"
                        />
                    </div>

                    {/* Search */}
                    <div className="px-4 pb-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar avaliação..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-lg pl-9"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 overflow-x-auto border-b border-border px-4">
                        {(
                            [
                                ['vedius', 'Avaliações Vedius'],
                                ['custom', 'Minhas avaliações'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={cn(
                                    'shrink-0 cursor-pointer border-b-2 pb-2 text-sm font-medium transition-colors',
                                    activeTab === key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Template list */}
                    <ScrollArea className="flex-1">
                        {activeTab === 'vedius' ? (
                            <>
                                {loadingTemplates && (
                                    <div className="space-y-1 px-2 py-2">
                                        {Array.from({ length: 8 }).map(
                                            (_, i) => (
                                                <Skeleton
                                                    key={i}
                                                    className="h-9 w-full rounded"
                                                />
                                            ),
                                        )}
                                    </div>
                                )}
                                {errorTemplates && (
                                    <div className="flex items-center gap-2 px-4 py-6 text-sm text-destructive">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        Erro ao carregar avaliações
                                    </div>
                                )}
                                {!loadingTemplates &&
                                    !errorTemplates &&
                                    templates?.length === 0 && (
                                        <p className="px-4 py-6 text-sm text-muted-foreground">
                                            Nenhuma avaliação encontrada.
                                        </p>
                                    )}
                                {!loadingTemplates && templates && (
                                    <div className="py-1">
                                        {templates.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() =>
                                                    setSelectedId(String(t.id))
                                                }
                                                className={cn(
                                                    'w-full cursor-pointer px-4 py-3 text-left text-sm transition-colors duration-150 md:py-2.5',
                                                    selectedId === String(t.id)
                                                        ? 'border-l-2 border-primary bg-accent text-accent-foreground'
                                                        : 'text-foreground hover:bg-accent/50',
                                                )}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center px-6 py-16 text-center">
                                <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                <p className="mb-1 text-sm font-medium text-foreground">
                                    Nenhuma avaliação ainda
                                </p>
                                <p className="mb-4 text-xs text-muted-foreground">
                                    Crie sua primeira avaliação personalizada
                                </p>
                                <Button
                                    size="sm"
                                    className="cursor-pointer gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Criar avaliação
                                </Button>
                            </div>
                        )}
                    </ScrollArea>
                </aside>

                {/* ── Right panel (preview) ───────────────── */}
                <div
                    className={cn(
                        'min-w-0 flex-1 flex-col',
                        showPreviewOnMobile ? 'flex' : 'hidden',
                        'md:flex',
                    )}
                >
                    {!selectedId ? (
                        <div className="hidden flex-1 flex-col items-center justify-center px-8 text-center md:flex">
                            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-foreground">
                                Selecione uma avaliação
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Escolha um modelo na lista ao lado para ver a
                                prévia
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="space-y-3 border-b border-border px-4 py-3 sm:px-6 sm:py-4">
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedId(null)}
                                        className="flex cursor-pointer items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:hidden"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Lista
                                    </button>
                                    <p className="text-xs tracking-wider text-muted-foreground uppercase md:hidden">
                                        Prévia
                                    </p>
                                    <div className="hidden shrink-0 gap-2 md:flex">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="cursor-pointer gap-2"
                                                >
                                                    <LinkIcon className="h-4 w-4" />
                                                    Enviar link remoto
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Enviar formulário ao paciente
                                            </TooltipContent>
                                        </Tooltip>
                                        <Button
                                            size="sm"
                                            className="cursor-pointer gap-2"
                                            onClick={handleRespond}
                                            disabled={
                                                createAssessment.isPending ||
                                                loadingTemplate
                                            }
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                            {createAssessment.isPending
                                                ? 'Criando...'
                                                : 'Responder agora'}
                                        </Button>
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-base leading-snug font-semibold text-foreground sm:text-lg">
                                        {selectedTemplateName ?? '...'}
                                    </h2>
                                    <p className="mt-1 hidden text-xs tracking-wider text-muted-foreground uppercase md:block">
                                        Prévia da avaliação
                                    </p>
                                </div>
                            </div>

                            {/* Preview content */}
                            <ScrollArea className="flex-1">
                                <div className="mx-auto max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6">
                                    {loadingTemplate && (
                                        <div className="space-y-4">
                                            {Array.from({ length: 3 }).map(
                                                (_, i) => (
                                                    <Skeleton
                                                        key={i}
                                                        className="h-40 w-full rounded-xl"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    )}
                                    {selectedTemplate?.sections.map(
                                        (section) => (
                                            <SectionPreview
                                                key={section.id}
                                                section={section}
                                            />
                                        ),
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Footer */}
                            <div className="flex flex-col gap-2 border-t border-border bg-card/80 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end sm:px-6">
                                <Button
                                    variant="outline"
                                    className="w-full cursor-pointer gap-2 sm:w-auto"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    Enviar link remoto
                                </Button>
                                <Button
                                    className="w-full cursor-pointer gap-2 sm:w-auto"
                                    onClick={handleRespond}
                                    disabled={
                                        createAssessment.isPending ||
                                        loadingTemplate
                                    }
                                >
                                    <ClipboardList className="h-4 w-4" />
                                    {createAssessment.isPending
                                        ? 'Criando...'
                                        : 'Responder agora'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
